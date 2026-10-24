import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
  });

// Always cache prisma client on globalThis across all environments (including serverless Netlify warm lambdas)
// to reuse connection pools and avoid repeated TLS/SSL handshakes
globalForPrisma.prisma = prisma;
