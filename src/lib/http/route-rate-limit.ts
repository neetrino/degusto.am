import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createProblem, problemTypes } from "@/lib/http/problem-details";
import { problemJson } from "@/lib/http/problem-response";
import { rateLimitBackendUnavailableResponse } from "@/lib/http/rate-limit-backend";
import { resolveUpstashRestCredentials } from "@/lib/redis/upstash-config";
import { logger } from "@/lib/utils/logger";

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

let upstashMissingLogged = false;

function warnUpstashMissingOnce(): void {
  if (upstashMissingLogged || process.env.NODE_ENV !== "production") {
    return;
  }
  upstashMissingLogged = true;
  logger.warn(
    "[RATE LIMIT] Upstash Redis not configured — route rate limiting disabled. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_* on Vercel)."
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
  const backendUnavailable = rateLimitBackendUnavailableResponse();
  if (backendUnavailable) {
    return backendUnavailable;
  }

  const credentials = resolveUpstashRestCredentials();
  if (!credentials) {
    warnUpstashMissingOnce();
    return null;
  }

  const redis = new Redis(credentials);
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
