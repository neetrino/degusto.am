import { NextResponse } from "next/server";
import {
  createProblem,
  databaseUnavailableDetail,
  problemTypes,
  type ProblemDetails,
} from "@/lib/http/problem-details";

export function problemJson(
  body: ProblemDetails,
  init?: { headers?: HeadersInit }
): NextResponse {
  return NextResponse.json(body, {
    status: body.status,
    headers: init?.headers,
  });
}

export function serviceUnavailableResponse(
  instance: string,
  options?: { retryAfterSeconds?: number }
): NextResponse {
  const retryAfter = options?.retryAfterSeconds ?? 15;
  return problemJson(
    createProblem("serviceUnavailable", {
      status: 503,
      title: "Service temporarily unavailable",
      detail: databaseUnavailableDetail(),
      instance,
    }),
    { headers: { "Retry-After": String(retryAfter) } }
  );
}

export function internalErrorResponse(
  instance: string,
  detail: string
): NextResponse {
  return problemJson(
    createProblem("internalError", {
      status: 500,
      title: "Internal Server Error",
      detail,
      instance,
    })
  );
}

export { problemTypes, createProblem, type ProblemDetails };
