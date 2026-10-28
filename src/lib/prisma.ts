import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Configure PostgreSQL connection pool limits specifically tuned for Neon serverless
 * and Netlify/Lambda environments:
 * - connection_limit=5 prevents exhausting Neon Free pooled limits when multiple lambdas spin up concurrently
 * - pool_timeout=10 fails fast if the pool is exhausted rather than hanging requests
 * - pgbouncer=true prevents prepared-statement errors on PgBouncer transaction pooling
 */
function getPooledDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    const isServerless = Boolean(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL);
    const targetLimit = isServerless ? "5" : "10";

    if (!parsed.searchParams.has("connection_limit")) {
      parsed.searchParams.set("connection_limit", targetLimit);
    }
    if (!parsed.searchParams.has("pool_timeout")) {
      parsed.searchParams.set("pool_timeout", "10");
    }
    if (parsed.host.includes("-pooler") && !parsed.searchParams.has("pgbouncer")) {
      parsed.searchParams.set("pgbouncer", "true");
    }
    return parsed.toString();
  } catch {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}connection_limit=5&pool_timeout=10&pgbouncer=true`;
  }
}

const pooledUrl = getPooledDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: pooledUrl ? { db: { url: pooledUrl } } : undefined,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

// Always cache prisma client on globalThis across all environments (including serverless Netlify warm lambdas)
// to reuse connection pools and avoid repeated TLS/SSL handshakes
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
} else {
  // In production serverless lambdas, globalThis retains state during warm container invocations
  globalForPrisma.prisma = prisma;
}
