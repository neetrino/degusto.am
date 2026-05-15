import { PrismaClient } from "./src/generated/prisma-client";
import {
  assertNoBuildPlaceholderInRuntime,
  buildDatabaseUrlLogFields,
  isNextBuildWithoutDbEnv,
  mergePostgresConnectionUrlTuning,
  NEXT_BUILD_DB_PLACEHOLDER,
} from "./postgres-connection";

declare global {
  var prisma: PrismaClient | undefined;
}

const globalForPrisma = globalThis as typeof globalThis & { prisma?: PrismaClient };

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

/** Resolved at module load so Prisma does not rely on `env("DATABASE_URL")` inside a Turbopack-bundled generated client (it can be inlined as empty). */
const resolvedDatabaseUrl = mergePostgresConnectionUrlTuning(databaseUrl);
const resolvedDirectUrl = mergePostgresConnectionUrlTuning(directUrl);

assertNoBuildPlaceholderInRuntime(resolvedDatabaseUrl, resolvedDirectUrl);

process.env.DATABASE_URL = resolvedDatabaseUrl;
process.env.DIRECT_URL = resolvedDirectUrl;

const devPrismaLogs: Array<"query" | "error" | "warn"> =
  process.env.NODE_ENV === "development" && process.env.PRISMA_LOG_QUERIES === "1"
    ? ["query", "error", "warn"]
    : ["error", "warn"];

const prismaErrorFormat = process.env.NODE_ENV === "development" ? "pretty" : "minimal";

const prismaClientOptions = {
  datasources: {
    db: {
      url: resolvedDatabaseUrl,
    },
  },
  log: process.env.NODE_ENV === "development" ? devPrismaLogs : (["error", "warn"] as Array<"error" | "warn">),
  errorFormat: prismaErrorFormat as "pretty" | "minimal",
};

function logDatabaseBootstrapOnce(): void {
  if (isNextBuildWithoutDbEnv()) return;
  const meta = buildDatabaseUrlLogFields(resolvedDatabaseUrl, resolvedDirectUrl);
  // Low-level package: structured stderr for Vercel/host logs (never log full URLs).
  console.warn("[@white-shop/db] Connection config (no secrets)", JSON.stringify(meta));
}

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient(prismaClientOptions);
  logDatabaseBootstrapOnce();
}

/** Reuse one client per serverless isolate / dev HMR (Prisma + Next.js guidance). */
export const db = globalForPrisma.prisma;
