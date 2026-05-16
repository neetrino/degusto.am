/** Valid-shaped URL only for `next build` when CI has no DB secrets (Prisma client must instantiate). */
export const NEXT_BUILD_DB_PLACEHOLDER =
  "postgresql://localhost:5432/_next_build_placeholder?schema=public";

export function isNextBuildWithoutDbEnv(): boolean {
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

function tryParsePostgresUrl(raw: string): URL | null {
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

/**
 * Normalize DATABASE_URL / DIRECT_URL from env (Vercel UI, .env files).
 * Strips wrapping quotes and whitespace that break Prisma init on serverless.
 */
export function normalizeDatabaseEnvUrl(raw: string): string {
  let value = raw.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim();
  }
  return value.replace(/\r?\n/g, "");
}

/** Redact credentials from error text for safe API responses. */
export function redactConnectionStringInMessage(message: string): string {
  return message.replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "postgresql://***");
}

/**
 * Append libpq params if missing: UTF-8 + bounded connect wait (faster fail than default).
 * Uses URL parsing so query strings stay valid.
 */
export function augmentCorePostgresParams(raw: string): string {
  if (!raw) return raw;
  const parsed = tryParsePostgresUrl(raw);
  if (!parsed) {
    let u = raw;
    if (!u.includes("client_encoding=")) {
      u += u.includes("?") ? "&client_encoding=UTF8" : "?client_encoding=UTF8";
    }
    if (!u.includes("connect_timeout=")) {
      const isVercelNeon =
        process.env.VERCEL === "1" && u.toLowerCase().includes("neon.tech");
      u += u.includes("?") ? `&connect_timeout=${isVercelNeon ? "30" : "12"}` : `?connect_timeout=${isVercelNeon ? "30" : "12"}`;
    }
    return u;
  }
  if (!parsed.searchParams.has("client_encoding")) {
    parsed.searchParams.set("client_encoding", "UTF8");
  }
  if (!parsed.searchParams.has("connect_timeout")) {
    const isVercelNeon =
      process.env.VERCEL === "1" && parsed.hostname.toLowerCase().endsWith("neon.tech");
    parsed.searchParams.set("connect_timeout", isVercelNeon ? "30" : "12");
  }
  return parsed.toString();
}

function isNeonHost(hostname: string): boolean {
  return hostname.toLowerCase().endsWith("neon.tech");
}

/**
 * Neon serverless driver + `@prisma/adapter-neon` (HTTP/WS).
 * **Opt-in** via `PRISMA_NEON_ADAPTER=1` — default is TCP + pooler (`pgbouncer=true`), same as typical Vercel+Neon apps.
 * The adapter path needs extra bundle deps; TCP avoids `prismaCode: init` on some monorepo/standalone deploys.
 */
export function shouldUseNeonDriverAdapterForRuntime(databaseUrl: string): boolean {
  if (process.env.PRISMA_NEON_ADAPTER !== "1") return false;
  const parsed = tryParsePostgresUrl(databaseUrl);
  if (!parsed || !isNeonHost(parsed.hostname)) return false;
  return true;
}

function isLikelyNeonPoolerHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (!isNeonHost(h)) return false;
  return h.includes("pooler") || h.includes("-pooler");
}

/** Neon expects TLS from cloud runtimes; connection strings sometimes omit sslmode. */
export function augmentNeonSslIfMissing(url: string): string {
  const parsed = tryParsePostgresUrl(url);
  if (!parsed) return url;
  if (!isNeonHost(parsed.hostname)) return url;
  if (!parsed.searchParams.has("sslmode")) {
    parsed.searchParams.set("sslmode", "require");
  }
  return parsed.toString();
}

/**
 * Neon pooled endpoints sit behind PgBouncer (transaction mode). Prisma requires `pgbouncer=true`
 * for correct prepared-statement behavior. On Vercel, cap connections per serverless instance.
 *
 * @see https://www.prisma.io/docs/orm/overview/databases/neon
 */
export function augmentNeonPrismaPoolerParams(url: string): string {
  const parsed = tryParsePostgresUrl(url);
  if (!parsed) return url;
  if (!isLikelyNeonPoolerHost(parsed.hostname)) return url;
  // `pgbouncer` / `connection_limit` are for Prisma's TCP engine + PgBouncer.
  // With `@prisma/adapter-neon` + `@neondatabase/serverless` Pool (HTTP/WS), they can break connects on Vercel.
  if (shouldUseNeonDriverAdapterForRuntime(url)) {
    return parsed.toString();
  }
  if (!parsed.searchParams.has("pgbouncer")) {
    parsed.searchParams.set("pgbouncer", "true");
  }
  if (process.env.VERCEL === "1" && !parsed.searchParams.has("connection_limit")) {
    parsed.searchParams.set("connection_limit", "1");
  }
  return parsed.toString();
}

export function mergePostgresConnectionUrlTuning(raw: string): string {
  return augmentNeonPrismaPoolerParams(augmentNeonSslIfMissing(augmentCorePostgresParams(raw)));
}

export type DatabaseUrlLogFields = {
  databaseUrlConfigured: boolean;
  directUrlConfigured: boolean;
  databaseHost: string | null;
  directHost: string | null;
  databaseLikelyNeonPooler: boolean;
  vercelRuntime: boolean;
  neonDriverAdapter: boolean;
};

/** Safe for logs: hostnames only, no credentials or full URLs. */
export function buildDatabaseUrlLogFields(
  databaseUrl: string,
  directUrl: string
): DatabaseUrlLogFields {
  const dbParsed = tryParsePostgresUrl(databaseUrl);
  const dirParsed = tryParsePostgresUrl(directUrl);
  return {
    databaseUrlConfigured: Boolean(databaseUrl.trim()),
    directUrlConfigured: Boolean(directUrl.trim()),
    databaseHost: dbParsed?.hostname ?? null,
    directHost: dirParsed?.hostname ?? null,
    databaseLikelyNeonPooler: dbParsed ? isLikelyNeonPoolerHost(dbParsed.hostname) : false,
    vercelRuntime: process.env.VERCEL === "1",
    neonDriverAdapter: shouldUseNeonDriverAdapterForRuntime(databaseUrl),
  };
}

/** Fails fast if build-time placeholders leaked into a real runtime (e.g. SKIP_DB_URL_VALIDATION misuse). */
export function assertNoBuildPlaceholderInRuntime(resolvedDatabaseUrl: string, resolvedDirectUrl: string): void {
  if (isNextBuildWithoutDbEnv()) return;
  const bad =
    resolvedDatabaseUrl.includes("_next_build_placeholder") ||
    resolvedDirectUrl.includes("_next_build_placeholder");
  if (bad) {
    throw new Error(
      "[@white-shop/db] DATABASE_URL/DIRECT_URL resolve to the Next.js build placeholder. Unset SKIP_DB_URL_VALIDATION for this environment and configure real PostgreSQL URLs (see .env.example)."
    );
  }
}
