import { NextRequest, NextResponse } from "next/server";
import { buildDatabaseUrlLogFields } from "@white-shop/db";
import { logger } from "@/lib/utils/logger";
import {
  internalErrorResponse,
  serviceUnavailableResponse,
} from "@/lib/http/problem-response";

/** Fields sometimes attached to thrown errors for Problem Details responses */
export type RouteCatchFields = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  message?: string;
};

/**
 * Narrow `unknown` from route catch blocks for JSON error bodies (strict TS, no `catch (e: any)`).
 */
export function parseRouteCatchError(error: unknown): RouteCatchFields {
  if (error instanceof Error) {
    return { message: error.message };
  }
  if (typeof error === "object" && error !== null) {
    const r = error as Record<string, unknown>;
    return {
      type: typeof r.type === "string" ? r.type : undefined,
      title: typeof r.title === "string" ? r.title : undefined,
      status: typeof r.status === "number" ? r.status : undefined,
      detail: typeof r.detail === "string" ? r.detail : undefined,
      message: typeof r.message === "string" ? r.message : undefined,
    };
  }
  return {};
}

const PRISMA_CONNECTION_CODES = new Set(["P1001", "P1002", "P1017"]);

/** Avoid importing `@prisma/client` here — it pulls the query engine into Turbopack NFT tracing. */
function isPrismaKnownRequestError(error: unknown): error is { code: string } {
  return (
    error instanceof Error &&
    error.name === "PrismaClientKnownRequestError" &&
    typeof (error as { code?: unknown }).code === "string"
  );
}

function isPrismaInitializationError(error: unknown): boolean {
  return error instanceof Error && error.name === "PrismaClientInitializationError";
}

/**
 * True when Prisma cannot reach PostgreSQL (Neon paused, wrong URL, network, etc.).
 */
export function isPrismaConnectionError(error: unknown): boolean {
  if (isPrismaKnownRequestError(error)) {
    return PRISMA_CONNECTION_CODES.has(error.code);
  }
  return isPrismaInitializationError(error);
}

/**
 * Map unknown route errors to JSON Problem Details (no raw Prisma stack traces to clients).
 */
export function apiRouteErrorResponse(
  req: NextRequest,
  error: unknown,
  logLabel: string
): NextResponse {
  const instance = req.url;

  if (isPrismaConnectionError(error)) {
    const code = isPrismaKnownRequestError(error) ? error.code : "init";
    logger.warn(`${logLabel} database unreachable`, {
      code,
      ...buildDatabaseUrlLogFields(
        (process.env.DATABASE_URL ?? "").trim(),
        (process.env.DIRECT_URL ?? "").trim()
      ),
    });
    return serviceUnavailableResponse(instance);
  }

  logger.error(logLabel, error);
  const safeDetail =
    process.env.NODE_ENV === "production"
      ? "An error occurred"
      : error instanceof Error
        ? error.message
        : "An error occurred";

  return internalErrorResponse(instance, safeDetail);
}
