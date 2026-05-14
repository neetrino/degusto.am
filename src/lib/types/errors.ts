/**
 * Error types for API error handling
 */

import { Prisma } from "@prisma/client";

export interface ApiError {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  message?: string;
  instance?: string;
}

export class AppError extends Error implements ApiError {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;

  constructor(
    message: string,
    status: number = 500,
    type?: string,
    title?: string,
    detail?: string,
    instance?: string
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type || 'https://api.shop.am/problems/internal-error';
    this.title = title || 'Internal Server Error';
    this.status = status;
    this.detail = detail || message;
    this.instance = instance;
  }
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard to check if error has ApiError shape
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('status' in error || 'type' in error || 'title' in error)
  );
}

function shouldMaskErrorDetail(status: number): boolean {
  return process.env.NODE_ENV === "production" && status >= 500;
}

const PRISMA_DB_UNAVAILABLE_CODES = new Set(["P1001", "P1002", "P1017"]);

function formatPrismaUniqueTarget(meta: unknown): string {
  if (!meta || typeof meta !== "object") {
    return "value";
  }
  const target = (meta as { target?: unknown }).target;
  if (Array.isArray(target)) {
    return target.map(String).join(", ");
  }
  if (typeof target === "string") {
    return target;
  }
  return "value";
}

function prismaKnownRequestToApiError(
  error: Prisma.PrismaClientKnownRequestError,
  instance?: string
): ApiError | null {
  if (PRISMA_DB_UNAVAILABLE_CODES.has(error.code)) {
    return {
      type: "https://api.shop.am/problems/service-unavailable",
      title: "Database temporarily unavailable",
      status: 503,
      detail:
        "Could not connect to PostgreSQL. Check DATABASE_URL, VPN/firewall, and that the database is running.",
      instance,
    };
  }

  if (error.code === "P2002") {
    const fields = formatPrismaUniqueTarget(error.meta);
    return {
      type: "https://api.shop.am/problems/conflict",
      title: "Conflict",
      status: 409,
      detail: `Unique constraint failed (${fields}). ${error.message}`,
      instance,
    };
  }

  if (error.code === "P2003") {
    return {
      type: "https://api.shop.am/problems/validation-error",
      title: "Invalid reference",
      status: 400,
      detail:
        "Foreign key constraint failed. Check brand, category, attribute, or related IDs.",
      instance,
    };
  }

  if (error.code === "P2025") {
    return {
      type: "https://api.shop.am/problems/not-found",
      title: "Not found",
      status: 404,
      detail: "The requested record was not found.",
      instance,
    };
  }

  return null;
}

/**
 * Convert unknown error to ApiError format
 */
export function toApiError(error: unknown, instance?: string): ApiError {
  if (isAppError(error)) {
    const status = error.status;
    return {
      type: error.type,
      title: error.title,
      status,
      detail: shouldMaskErrorDetail(status)
        ? "An internal error occurred"
        : error.detail,
      instance: error.instance || instance,
    };
  }

  if (isApiError(error)) {
    const status =
      typeof error.status === "number" ? error.status : 500;
    return {
      type: error.type || 'https://api.shop.am/problems/internal-error',
      title: error.title || 'Internal Server Error',
      status,
      detail: shouldMaskErrorDetail(status)
        ? "An internal error occurred"
        : error.detail || error.message || 'An error occurred',
      instance: error.instance || instance,
    };
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = prismaKnownRequestToApiError(error, instance);
    if (mapped) {
      // Curated messages only (no stack traces); keep visible in production for ops.
      return mapped;
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    const status = 400;
    return {
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation error",
      status,
      detail: shouldMaskErrorDetail(status)
        ? "Invalid data"
        : error.message,
      instance,
    };
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    const status = 503;
    return {
      type: "https://api.shop.am/problems/service-unavailable",
      title: "Database temporarily unavailable",
      status,
      detail: shouldMaskErrorDetail(status)
        ? "An internal error occurred"
        : error.message || "Database client failed to initialize.",
      instance,
    };
  }

  if (error instanceof Error) {
    const status = 500;
    return {
      type: 'https://api.shop.am/problems/internal-error',
      title: 'Internal Server Error',
      status,
      detail: shouldMaskErrorDetail(status)
        ? 'An internal error occurred'
        : error.message || 'An error occurred',
      instance,
    };
  }

  return {
    type: 'https://api.shop.am/problems/internal-error',
    title: 'Internal Server Error',
    status: 500,
    detail: 'An unknown error occurred',
    instance,
  };
}




