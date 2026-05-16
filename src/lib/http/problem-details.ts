/**
 * RFC 7807 Problem Details — host-agnostic relative `type` URIs and shared builders.
 */

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  code?: string;
}

/** Relative problem type URIs (valid per RFC 7807; work on any deployment host). */
export const problemTypes = {
  validationError: "/problems/validation-error",
  unauthorized: "/problems/unauthorized",
  forbidden: "/problems/forbidden",
  notFound: "/problems/not-found",
  conflict: "/problems/conflict",
  badRequest: "/problems/bad-request",
  internalError: "/problems/internal-error",
  serviceUnavailable: "/problems/service-unavailable",
  configError: "/problems/config-error",
  tooManyRequests: "/problems/too-many-requests",
} as const;

export type ProblemTypeUri = (typeof problemTypes)[keyof typeof problemTypes];

const PROBLEM_CODE: Record<keyof typeof problemTypes, string> = {
  validationError: "VALIDATION_ERROR",
  unauthorized: "UNAUTHORIZED",
  forbidden: "FORBIDDEN",
  notFound: "NOT_FOUND",
  conflict: "CONFLICT",
  badRequest: "BAD_REQUEST",
  internalError: "INTERNAL_ERROR",
  serviceUnavailable: "SERVICE_UNAVAILABLE",
  configError: "CONFIG_ERROR",
  tooManyRequests: "TOO_MANY_REQUESTS",
};

export type ProblemKind = keyof typeof problemTypes;

export function createProblem(
  kind: ProblemKind,
  params: {
    status: number;
    title: string;
    detail: string;
    instance?: string;
  }
): ProblemDetails {
  return {
    type: problemTypes[kind],
    code: PROBLEM_CODE[kind],
    status: params.status,
    title: params.title,
    detail: params.detail,
    instance: params.instance,
  };
}

/** User-safe detail when the database is unreachable (production). */
export const DATABASE_UNAVAILABLE_PUBLIC_DETAIL =
  "Service is temporarily unavailable. Please try again in a moment.";

export function databaseUnavailableDetail(): string {
  if (process.env.NODE_ENV === "production") {
    return DATABASE_UNAVAILABLE_PUBLIC_DETAIL;
  }
  return (
    "Could not connect to PostgreSQL. Check DATABASE_URL, VPN/firewall, and that " +
    "the database is running (e.g. wake a paused Neon branch)."
  );
}
