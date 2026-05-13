import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const globalForPrisma = globalThis as typeof globalThis & { prisma?: PrismaClient };

/** Valid-shaped URL only for `next build` when CI has no DB secrets (Prisma client must instantiate). */
const NEXT_BUILD_DB_PLACEHOLDER =
  "postgresql://localhost:5432/_next_build_placeholder?schema=public";

function isNextBuildWithoutDbEnv(): boolean {
  if (process.env.SKIP_DB_URL_VALIDATION === "1") {
    return true;
  }
  const phase = process.env.NEXT_PHASE ?? "";
  return (
    phase === "phase-production-build" ||
    phase === "phase-development-build" ||
    phase === "phase-export"
  );
}

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

let databaseUrl = (process.env.DATABASE_URL ?? "").trim();
let directUrl = (process.env.DIRECT_URL ?? "").trim();

if ((!databaseUrl || !directUrl) && isNextBuildWithoutDbEnv()) {
  databaseUrl = databaseUrl || NEXT_BUILD_DB_PLACEHOLDER;
  directUrl = directUrl || NEXT_BUILD_DB_PLACEHOLDER;
}

if (!databaseUrl) {
  throw new Error(
    "[@white-shop/db] DATABASE_URL is missing or empty. Set it in `.env` or `.env.local` at the repo root (see `.env.example`). Prisma requires a non-empty PostgreSQL connection string."
  );
}

if (!directUrl) {
  throw new Error(
    "[@white-shop/db] DIRECT_URL is missing or empty. Prisma schema requires it. For a single local Postgres instance, set DIRECT_URL to the same connection string as DATABASE_URL."
  );
}

/** Resolved at module load so Prisma does not rely on `env("DATABASE_URL")` inside a Turbopack-bundled `@prisma/client` (it can be inlined as empty). */
const resolvedDatabaseUrl = augmentDatabaseUrl(databaseUrl);
const resolvedDirectUrl = augmentDatabaseUrl(directUrl);

process.env.DATABASE_URL = resolvedDatabaseUrl;
process.env.DIRECT_URL = resolvedDirectUrl;

const devPrismaLogs: Array<"query" | "error" | "warn"> =
  process.env.NODE_ENV === "development" && process.env.PRISMA_LOG_QUERIES === "1"
    ? ["query", "error", "warn"]
    : ["error", "warn"];

const prismaClientOptions = {
  datasources: {
    db: {
      url: resolvedDatabaseUrl,
    },
  },
  log: process.env.NODE_ENV === "development" ? devPrismaLogs : (["error"] as Array<"error">),
  errorFormat: "pretty" as const,
};

export const db =
  globalForPrisma.prisma ?? new PrismaClient(prismaClientOptions);

// Prisma Client connects automatically on first query (lazy connection)
// No need to call $connect() explicitly as it can cause issues in Next.js API routes
// Connection will be established automatically when the first database query is made

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

