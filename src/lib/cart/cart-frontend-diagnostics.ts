import { ApiError } from "@/lib/api-client/types";
import { logger } from "@/lib/utils/logger";

type FrontendDiagLevel = "warn" | "error";

type CartFrontendDiagnosticInput = {
  event:
    | "cart_read_failed"
    | "mutation_failed"
    | "stale_response_ignored"
    | "fallback_used"
    | "optimistic_item_reconciliation";
  operation: "read" | "add" | "update" | "delete" | "reconcile";
  endpoint: string;
  requestSequenceId: string;
  status?: number | null;
  preservedPreviousState?: boolean;
  level?: FrontendDiagLevel;
  error?: unknown;
  details?: Record<string, unknown>;
};

type FrontendErrorMeta = {
  name: string;
  message: string;
  status: number | null;
  kind: "api_error" | "network_error" | "validation_error" | "unknown_error";
};

function shouldEmit(level: FrontendDiagLevel): boolean {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }
  const mode = process.env.NEXT_PUBLIC_CART_DIAGNOSTICS;
  return mode === "warn" && level !== "error";
}

function extractErrorMeta(error: unknown): FrontendErrorMeta {
  if (error instanceof ApiError) {
    return {
      name: error.name,
      message: error.message,
      status: error.status,
      kind: error.status >= 400 && error.status < 500 ? "validation_error" : "api_error",
    };
  }
  if (error instanceof TypeError && /fetch|network|failed to fetch|econn/i.test(error.message)) {
    return {
      name: error.name,
      message: error.message,
      status: null,
      kind: "network_error",
    };
  }
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      status: null,
      kind: "unknown_error",
    };
  }
  return {
    name: "UnknownError",
    message: String(error),
    status: null,
    kind: "unknown_error",
  };
}

export function logCartFrontendDiagnostic(input: CartFrontendDiagnosticInput): void {
  const level = input.level ?? "warn";
  if (!shouldEmit(level)) {
    return;
  }

  const errorMeta = input.error ? extractErrorMeta(input.error) : null;
  const payload = {
    source: "cart_frontend",
    event: input.event,
    operation: input.operation,
    endpoint: input.endpoint,
    requestSequenceId: input.requestSequenceId,
    status: input.status ?? errorMeta?.status ?? null,
    preservedPreviousState: input.preservedPreviousState ?? null,
    errorKind: errorMeta?.kind ?? null,
    errorName: errorMeta?.name ?? null,
    errorMessage: errorMeta?.message ?? null,
    ...input.details,
  };

  if (level === "error") {
    logger.error("[CART_FRONTEND] diagnostic", payload);
    return;
  }
  logger.warn("[CART_FRONTEND] diagnostic", payload);
}
