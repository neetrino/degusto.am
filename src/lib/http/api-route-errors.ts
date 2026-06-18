import { NextRequest, NextResponse } from "next/server";
import { buildDatabaseUrlLogFields } from "@white-shop/db";
import { logger } from "@/lib/utils/logger";
import { problemTypes } from "@/lib/http/problem-details";
import {
  internalErrorResponse,
  problemJson,
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

type RouteCatchOptions = {
  suppressLogging?: boolean;
};

type ErrorMeta = {
  name: string;
  message: string;
  code?: string;
};

function extractErrorMeta(error: unknown): ErrorMeta {
  if (error instanceof Error) {
    const withCode = error as Error & { code?: unknown };
    return {
      name: error.name,
      message: error.message,
      code: typeof withCode.code === "string" ? withCode.code : undefined,
    };
  }
  if (typeof error === "object" && error !== null) {
    const record = error as Record<string, unknown>;
    return {
      name: typeof record.name === "string" ? record.name : "UnknownError",
      message: typeof record.message === "string" ? record.message : String(error),
      code: typeof record.code === "string" ? record.code : undefined,
    };
  }
  return { name: "UnknownError", message: String(error) };
}

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

const PRISMA_CONNECTION_CODES = new Set(["P1001", "P1002", "P1017", "P2024"]);
const PRISMA_BAD_REQUEST_CODES = new Set(["P2000", "P2009", "P2011", "P2012", "P2023"]);
const PRISMA_NOT_FOUND_CODES = new Set(["P2001", "P2025"]);
const PRISMA_CONFLICT_CODES = new Set(["P2002", "P2003", "P2034"]);

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

function mapPrismaKnownRequestError(
  req: NextRequest,
  error: { code: string },
  logLabel: string,
  options?: RouteCatchOptions
): NextResponse | null {
  const instance = req.url;
  const fallbackDetail = "The request could not be processed.";
  const mapped = PRISMA_BAD_REQUEST_CODES.has(error.code)
    ? { type: problemTypes.badRequest, title: "Bad Request", status: 400, detail: fallbackDetail }
    : PRISMA_NOT_FOUND_CODES.has(error.code)
      ? {
          type: problemTypes.notFound,
          title: "Not Found",
          status: 404,
          detail: "Requested resource was not found.",
        }
      : PRISMA_CONFLICT_CODES.has(error.code)
        ? {
            type: problemTypes.conflict,
            title: "Conflict",
            status: 409,
            detail: "Request conflicts with current resource state.",
          }
        : null;
  if (!mapped) return null;

  if (!options?.suppressLogging) {
    logger.warn(`${logLabel} prisma request error mapped`, {
      requestPath: req.nextUrl.pathname,
      method: req.method,
      code: error.code,
      mappedStatus: mapped.status,
    });
  }
  return problemJson({ ...mapped, instance });
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
  logLabel: string,
  options?: RouteCatchOptions
): NextResponse {
  const instance = req.url;
  const errorMeta = extractErrorMeta(error);

  if (isPrismaConnectionError(error)) {
    const code = isPrismaKnownRequestError(error) ? error.code : "init";
    if (!options?.suppressLogging) {
      logger.warn(`${logLabel} database unreachable`, {
        code,
        requestPath: req.nextUrl.pathname,
        method: req.method,
        errorName: errorMeta.name,
        errorMessage: errorMeta.message,
        ...buildDatabaseUrlLogFields(
          (process.env.DATABASE_URL ?? "").trim(),
          (process.env.DIRECT_URL ?? "").trim()
        ),
      });
    }
    return serviceUnavailableResponse(instance);
  }

  if (!options?.suppressLogging) {
    logger.error(logLabel, {
      requestPath: req.nextUrl.pathname,
      method: req.method,
      errorName: errorMeta.name,
      errorMessage: errorMeta.message,
      errorCode: errorMeta.code ?? null,
    });
  }
  const safeDetail =
    process.env.NODE_ENV === "production"
      ? "An error occurred"
      : error instanceof Error
        ? error.message
        : "An error occurred";

  return internalErrorResponse(instance, safeDetail);
}

/**
 * Maps route errors to Problem Details: Prisma connectivity → 503, thrown `{ status }` → that status, else 500.
 */
export function apiRouteCatchErrorResponse(
  req: NextRequest,
  error: unknown,
  logLabel: string,
  options?: RouteCatchOptions
): NextResponse {
  if (isPrismaConnectionError(error)) {
    return apiRouteErrorResponse(req, error, logLabel, options);
  }

  if (isPrismaKnownRequestError(error)) {
    const mapped = mapPrismaKnownRequestError(req, error, logLabel, options);
    if (mapped) {
      return mapped;
    }
  }

  const e = parseRouteCatchError(error);
  const errorMeta = extractErrorMeta(error);
  const status = e.status;
  if (typeof status === "number" && status >= 400 && status < 600) {
    if (status >= 500) {
      if (!options?.suppressLogging) {
        logger.error(logLabel, {
          requestPath: req.nextUrl.pathname,
          method: req.method,
          status,
          errorName: errorMeta.name,
          errorMessage: errorMeta.message,
          errorCode: errorMeta.code ?? null,
        });
      }
    } else {
      if (!options?.suppressLogging) {
        logger.warn(logLabel, {
          requestPath: req.nextUrl.pathname,
          method: req.method,
          status,
          detail: e.detail ?? e.message,
        });
      }
    }
    return problemJson(
      {
        type: e.type ?? problemTypes.internalError,
        title: e.title ?? "Error",
        status,
        detail: e.detail ?? e.message ?? "An error occurred",
        instance: req.url,
      },
      status >= 503 ? { headers: { "Retry-After": "15" } } : undefined
    );
  }

  return apiRouteErrorResponse(req, error, logLabel, options);
}
