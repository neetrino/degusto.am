import type { NextRequest } from "next/server";
import { logger } from "@/lib/utils/logger";

type CartOperation = "read" | "add" | "update" | "delete";

type CartApiLogInput = {
  request: NextRequest;
  operation: CartOperation;
  startedAt: number;
  status: number;
  hasCartId: boolean;
  hasUser: boolean;
  hasSession: boolean;
  requestSequenceId: string;
  error?: unknown;
};

type CartApiErrorMeta = {
  name: string;
  message: string;
  databaseCode: string | null;
};

function extractDatabaseCode(error: unknown): string | null {
  if (!error || typeof error !== "object") {
    return null;
  }
  const record = error as Record<string, unknown>;
  if (typeof record.code === "string") {
    return record.code;
  }
  const cause = record.cause;
  if (cause && typeof cause === "object") {
    const causeCode = (cause as Record<string, unknown>).code;
    return typeof causeCode === "string" ? causeCode : null;
  }
  return null;
}

function extractErrorMeta(error: unknown): CartApiErrorMeta {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      databaseCode: extractDatabaseCode(error),
    };
  }
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    return {
      name: typeof record.name === "string" ? record.name : "UnknownError",
      message: typeof record.message === "string" ? record.message : "Unknown error",
      databaseCode: extractDatabaseCode(error),
    };
  }
  return {
    name: "UnknownError",
    message: String(error),
    databaseCode: null,
  };
}

function classifyFailure(status: number, error: CartApiErrorMeta): string {
  if (error.databaseCode || error.name.includes("Prisma")) {
    return "db_error";
  }
  if (status === 400 || status === 422) {
    return "validation_error";
  }
  if (status === 401 || status === 403) {
    return "session_or_cookie_error";
  }
  if (error.name === "TypeError" && /fetch|network|econn/i.test(error.message)) {
    return "network_error";
  }
  if (status >= 500) {
    return "internal_error";
  }
  return "unknown_error";
}

function resolveLogLevel(status: number): "warn" | "error" {
  return status >= 500 ? "error" : "warn";
}

export function createCartRequestSequenceId(request: NextRequest): string {
  const forwarded = request.headers.get("x-request-id");
  if (forwarded && forwarded.trim()) {
    return forwarded.trim();
  }
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return `${Date.now().toString(36)}-${randomSuffix}`;
}

export function logCartApiDiagnostic(input: CartApiLogInput): void {
  const durationMs = Date.now() - input.startedAt;
  const basePayload = {
    source: "cart_api",
    route: input.request.nextUrl.pathname,
    endpoint: input.request.nextUrl.pathname,
    method: input.request.method,
    operation: input.operation,
    status: input.status,
    durationMs,
    requestSequenceId: input.requestSequenceId,
    hasCartId: input.hasCartId,
    hasUser: input.hasUser,
    hasSession: input.hasSession,
  };

  if (!input.error) {
    logger.info("[CART_API] operation_completed", basePayload);
    return;
  }

  const errorMeta = extractErrorMeta(input.error);
  const payload = {
    ...basePayload,
    errorType: classifyFailure(input.status, errorMeta),
    errorName: errorMeta.name,
    errorMessage: errorMeta.message,
    databaseErrorCode: errorMeta.databaseCode,
  };
  const level = resolveLogLevel(input.status);
  if (level === "error") {
    logger.error("[CART_API] operation_failed", payload);
    return;
  }
  logger.warn("[CART_API] operation_failed", payload);
}
