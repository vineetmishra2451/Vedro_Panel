/**
 * High-performance client-side multi-tier cache helper.
 * - L1: In-memory Map for instantaneous zero-latency lookups without JSON serialization
 * - L2: Persistent localStorage for offline/page-reload instant hydration
 * - In-flight Promise deduplication: Merges concurrent identical GET requests
 */

const CACHE_PREFIX = "vedro_cache_";
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEnvelope<T> {
  timestamp: number;
  ttl: number;
  data: T;
}

// L1 In-Memory Cache (lives across component lifecycles in the browser tab)
const memoryCache = new Map<string, CacheEnvelope<any>>();

// In-Flight Request Deduplication Map
const inFlightRequests = new Map<string, Promise<any>>();

export function getCachedData<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  // 1. Check L1 Memory Cache (Instant, no JSON.parse overhead)
  const memHit = memoryCache.get(key);
  if (memHit) {
    if (Date.now() - memHit.timestamp < memHit.ttl) {
      return memHit.data as T;
    }
    // Expired in memory
    memoryCache.delete(key);
  }

  // 2. Check L2 Persistent Storage
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;

    const envelope: CacheEnvelope<T> = JSON.parse(raw);
    if (!envelope || envelope.data === undefined) return null;

    const ttl = envelope.ttl || DEFAULT_TTL_MS;
    if (Date.now() - envelope.timestamp > ttl) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }

    // Promote to L1 Memory Cache for subsequent instant reads
    memoryCache.set(key, envelope);
    return envelope.data;
  } catch (err) {
    console.warn(`[Cache] Failed to read ${key} from localStorage:`, err);
    return null;
  }
}

export function setCachedData<T>(key: string, data: T, ttlMs = DEFAULT_TTL_MS): void {
  if (typeof window === "undefined") return;

  const envelope: CacheEnvelope<T> = {
    timestamp: Date.now(),
    ttl: ttlMs,
    data,
  };

  // 1. Write to L1 Memory Cache
  memoryCache.set(key, envelope);

  // 2. Write to L2 Persistent Storage
  try {
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(envelope));
  } catch (err) {
    // Gracefully handle storage quota or private browsing restrictions
    console.warn(`[Cache] Failed to write ${key} to localStorage:`, err);
  }
}

export function clearCachedData(key: string): void {
  if (typeof window === "undefined") return;

  memoryCache.delete(key);
  try {
    localStorage.removeItem(`${CACHE_PREFIX}${key}`);
  } catch (err) {
    console.warn(`[Cache] Failed to clear ${key}:`, err);
  }
}

export function invalidateCache(keys?: string[]): void {
  if (typeof window === "undefined") return;

  if (keys && keys.length > 0) {
    for (const key of keys) {
      clearCachedData(key);
    }
  } else {
    // Clear all keys with CACHE_PREFIX
    memoryCache.clear();
    try {
      const allKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(CACHE_PREFIX)) {
          allKeys.push(k);
        }
      }
      for (const k of allKeys) {
        localStorage.removeItem(k);
      }
    } catch (err) {
      console.warn("[Cache] Failed to clear all cache keys:", err);
    }
  }
}

/**
 * Deduplicated fetch that prevents duplicate concurrent requests to the same endpoint.
 * If a request for the same URL is already in-flight, returns the existing promise.
 */
export async function fetchWithDeduplication<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const method = options?.method?.toUpperCase() || "GET";
  // Only deduplicate idempotent GET requests
  if (method !== "GET") {
    const res = await fetch(url, options);
    return res.json();
  }

  const existing = inFlightRequests.get(url);
  if (existing) {
    return existing;
  }

  const promise = (async () => {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        throw new Error(`Fetch failed with status ${res.status}`);
      }
      const data = await res.json();
      return data as T;
    } finally {
      inFlightRequests.delete(url);
    }
  })();

  inFlightRequests.set(url, promise);
  return promise;
}
