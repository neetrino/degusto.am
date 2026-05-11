import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";

const SERVICE_UNAVAILABLE = "https://api.shop.am/problems/service-unavailable";
const INTERNAL = "https://api.shop.am/problems/internal-error";

const PRISMA_CONNECTION_CODES = new Set(["P1001", "P1002", "P1017"]);

/**
 * True when Prisma cannot reach PostgreSQL (Neon paused, wrong URL, network, etc.).
 */
export function isPrismaConnectionError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return PRISMA_CONNECTION_CODES.has(error.code);
  }
  return error instanceof Prisma.PrismaClientInitializationError;
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
    const code =
      error instanceof Prisma.PrismaClientKnownRequestError ? error.code : "init";
    logger.warn(`${logLabel} database unreachable`, { code });
    return NextResponse.json(
      {
        type: SERVICE_UNAVAILABLE,
        title: "Database temporarily unavailable",
        status: 503,
        detail:
          "Could not connect to PostgreSQL. Check DATABASE_URL, VPN/firewall, and that the database is running (e.g. wake a paused Neon branch).",
        instance,
      },
      { status: 503, headers: { "Retry-After": "15" } }
    );
  }

  logger.error(logLabel, error);
  const safeDetail =
    process.env.NODE_ENV === "production"
      ? "An error occurred"
      : error instanceof Error
        ? error.message
        : "An error occurred";

  return NextResponse.json(
    {
      type: INTERNAL,
      title: "Internal Server Error",
      status: 500,
      detail: safeDetail,
      instance,
    },
    { status: 500 }
  );
}
