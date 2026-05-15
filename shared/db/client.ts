import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const globalForPrisma = globalThis as typeof globalThis & { prisma?: PrismaClient };

/**
 * Append libpq params if missing: UTF-8 + bounded connect wait (faster fail than default).
 */
function augmentDatabaseUrl(raw: string): string {
  if (!raw) return raw;
  let u = raw;
  if (!u.includes("client_encoding=")) {
    u += u.includes("?") ? "&client_encoding=UTF8" : "?client_encoding=UTF8";
  }
  if (!u.includes("connect_timeout=")) {
    u += u.includes("?") ? "&connect_timeout=12" : "?connect_timeout=12";
  }
  return u;
}

const databaseUrl = process.env.DATABASE_URL || "";
process.env.DATABASE_URL = augmentDatabaseUrl(databaseUrl);

const devPrismaLogs =
  process.env.NODE_ENV === "development" && process.env.PRISMA_LOG_QUERIES === "1"
    ? (["query", "error", "warn"] as const)
    : (["error", "warn"] as const);

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? [...devPrismaLogs] : ["error"],
    errorFormat: "pretty",
  });

// Prisma Client connects automatically on first query (lazy connection)
// No need to call $connect() explicitly as it can cause issues in Next.js API routes
// Connection will be established automatically when the first database query is made

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

