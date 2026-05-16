import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig, Pool } from "@neondatabase/serverless";
import { PrismaClient } from "./src/generated/prisma-client";
import WebSocket from "ws";
import {
  assertNoBuildPlaceholderInRuntime,
  buildDatabaseUrlLogFields,
  isNextBuildWithoutDbEnv,
  mergePostgresConnectionUrlTuning,
  NEXT_BUILD_DB_PLACEHOLDER,
  normalizeDatabaseEnvUrl,
  shouldUseNeonDriverAdapterForRuntime,
} from "./postgres-connection";

declare global {
  var prisma: PrismaClient | undefined;
  var neonSqlPool: Pool | undefined;
}

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
  neonSqlPool?: Pool;
};

let databaseUrl = normalizeDatabaseEnvUrl(process.env.DATABASE_URL ?? "");
let directUrl = normalizeDatabaseEnvUrl(process.env.DIRECT_URL ?? "");

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

const useNeonDriverAdapter = shouldUseNeonDriverAdapterForRuntime(resolvedDatabaseUrl);

const devPrismaLogs: Array<"query" | "error" | "warn"> =
  process.env.NODE_ENV === "development" && process.env.PRISMA_LOG_QUERIES === "1"
    ? ["query", "error", "warn"]
    : ["error", "warn"];

const prodPrismaLogs = ["error", "warn"] as const;

const prismaErrorFormat = process.env.NODE_ENV === "development" ? "pretty" : "minimal";

function configureNeonPoolForNodeRuntime(): void {
  // Vercel: prefer HTTP fetch for Pool.query (avoids WebSocket/ws bundling issues on serverless).
  // @see https://github.com/neondatabase/serverless/blob/main/CONFIG.md#poolqueryviafetch-boolean
  if (process.env.VERCEL === "1") {
    neonConfig.poolQueryViaFetch = true;
    return;
  }
  // Local Node: no global WebSocket — Neon's Pool needs one for WS transport.
  neonConfig.webSocketConstructor =
    typeof globalThis.WebSocket === "function" ? globalThis.WebSocket : WebSocket;
}

function createPrismaClient(): PrismaClient {
  if (useNeonDriverAdapter) {
    configureNeonPoolForNodeRuntime();
    if (!globalForPrisma.neonSqlPool) {
      globalForPrisma.neonSqlPool = new Pool({
        connectionString: resolvedDatabaseUrl,
        max: 1,
      });
    }
    const adapter = new PrismaNeon(globalForPrisma.neonSqlPool);
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? devPrismaLogs : [...prodPrismaLogs],
      errorFormat: prismaErrorFormat as "pretty" | "minimal",
    });
  }

  return new PrismaClient({
    datasources: {
      db: {
        url: resolvedDatabaseUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? devPrismaLogs : [...prodPrismaLogs],
    errorFormat: prismaErrorFormat as "pretty" | "minimal",
  });
}

function logDatabaseBootstrapOnce(): void {
  if (isNextBuildWithoutDbEnv()) return;
  const meta = buildDatabaseUrlLogFields(resolvedDatabaseUrl, resolvedDirectUrl);
  console.warn("[@white-shop/db] Connection config (no secrets)", JSON.stringify(meta));
}

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = createPrismaClient();
  logDatabaseBootstrapOnce();
}

/** Reuse one client per serverless isolate / dev HMR (Prisma + Next.js guidance). */
export const db = globalForPrisma.prisma;
