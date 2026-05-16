import { db, redactConnectionStringInMessage } from "@white-shop/db";
import { isPrismaConnectionError } from "@/lib/http/api-route-errors";
import { logger } from "@/lib/utils/logger";

const DEFAULT_PING_TIMEOUT_MS =
  process.env.VERCEL === "1" ? 12_000 : 5_000;

export type DbPingOk = { ok: true; latencyMs: number };
export type DbPingFail = {
  ok: false;
  reason: "connection" | "timeout" | "unknown";
  prismaCode?: string;
  /** Safe hint for /api/health/db (no credentials). */
  hint?: string;
};
export type DbPingResult = DbPingOk | DbPingFail;

/**
 * Lightweight connectivity check for health endpoints (no payload from DB).
 */
export async function pingDatabase(
  timeoutMs: number = DEFAULT_PING_TIMEOUT_MS
): Promise<DbPingResult> {
  const started = Date.now();
  try {
    await Promise.race([
      db.$queryRaw`SELECT 1`,
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error("timeout"));
        }, timeoutMs);
      }),
    ]);
    return { ok: true, latencyMs: Date.now() - started };
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "timeout") {
      logger.warn("[db-ping] timed out", { timeoutMs });
      return { ok: false, reason: "timeout" };
    }
    if (isPrismaConnectionError(error)) {
      const code =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof (error as { code: unknown }).code === "string"
          ? (error as { code: string }).code
          : "init";
      const hint =
        error instanceof Error
          ? redactConnectionStringInMessage(error.message).slice(0, 200)
          : undefined;
      logger.warn("[db-ping] database unreachable", { code, hint });
      return { ok: false, reason: "connection", prismaCode: code, hint };
    }
    const hint =
      error instanceof Error
        ? redactConnectionStringInMessage(error.message).slice(0, 200)
        : undefined;
    logger.warn("[db-ping] unexpected failure", { hint });
    return { ok: false, reason: "unknown", hint };
  }
}
