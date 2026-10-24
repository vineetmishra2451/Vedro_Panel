/**
 * Client-side persistent cache helper for offline-first and instantaneous page loads.
 * Saves the last fetched API responses to localStorage so the UI renders instantly
 * on return visits or page refreshes without showing blank/loading screens.
 */

const CACHE_PREFIX = "vedro_cache_";
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEnvelope<T> {
  timestamp: number;
  data: T;
}

export function getCachedData<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;

    const envelope: CacheEnvelope<T> = JSON.parse(raw);
    if (!envelope || !envelope.data) return null;

    // Return cached data immediately
    return envelope.data;
  } catch (err) {
    console.warn(`[Cache] Failed to read ${key} from localStorage:`, err);
    return null;
  }
}

export function setCachedData<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;

  try {
    const envelope: CacheEnvelope<T> = {
      timestamp: Date.now(),
      data,
    };
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(envelope));
  } catch (err) {
    // Gracefully handle storage quota errors or private browsing restrictions
    console.warn(`[Cache] Failed to write ${key} to localStorage:`, err);
  }
}

export function clearCachedData(key: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(`${CACHE_PREFIX}${key}`);
  } catch (err) {
    console.warn(`[Cache] Failed to clear ${key}:`, err);
  }
}
