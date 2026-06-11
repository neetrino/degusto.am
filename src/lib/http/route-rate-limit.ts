import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createProblem, problemTypes } from "@/lib/http/problem-details";
import { problemJson } from "@/lib/http/problem-response";

type RateLimitWindow = "60 s" | "10 s";

type RateLimitOptions = {
  prefix: string;
  limit: number;
  window: RateLimitWindow;
  detail: string;
  keySuffix?: string;
};

function resolveClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Returns `null` when allowed, otherwise a Problem Details response with status 429.
 * If Upstash isn't configured, rate limiting is skipped.
 */
export async function enforceRouteRateLimit(
  request: NextRequest,
  options: RateLimitOptions
): Promise<NextResponse | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (process.env.NODE_ENV === "production") {
      return problemJson(
        createProblem("serviceUnavailable", {
          status: 503,
          title: "Service temporarily unavailable",
          detail: "Rate limiter is not configured",
          instance: request.url,
        }),
        { headers: { "Retry-After": "30" } }
      );
    }
    return null;
  }

  const redis = new Redis({ url, token });
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(options.limit, options.window),
    prefix: options.prefix,
  });

  const ip = resolveClientIp(request);
  const key = options.keySuffix ? `${ip}:${options.keySuffix}` : ip;
  const { success } = await ratelimit.limit(key);
  if (success) {
    return null;
  }

  return problemJson(
    createProblem("tooManyRequests", {
      status: 429,
      title: "Too Many Requests",
      detail: options.detail,
      instance: request.url,
    }),
    { headers: { "Retry-After": "15" } }
  );
}

export { problemTypes };
