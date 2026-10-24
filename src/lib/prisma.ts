import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Configure PostgreSQL connection pool limits (10–20 connections max)
 * to maximize throughput while avoiding exhausting database server connections.
 */
function getPooledDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has("connection_limit")) {
      parsed.searchParams.set("connection_limit", "15");
    }
    if (!parsed.searchParams.has("pool_timeout")) {
      parsed.searchParams.set("pool_timeout", "20");
    }
    return parsed.toString();
  } catch {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}connection_limit=15&pool_timeout=20`;
  }
}

const pooledUrl = getPooledDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: pooledUrl ? { db: { url: pooledUrl } } : undefined,
    log: ["error"],
  });

// Always cache prisma client on globalThis across all environments (including serverless Netlify warm lambdas)
// to reuse connection pools and avoid repeated TLS/SSL handshakes
globalForPrisma.prisma = prisma;
