import { NextRequest, NextResponse } from "next/server";
import { extractAuthTokenFromRequest } from "@/lib/auth/auth-cookies";
import { getCachedUserRoles } from "@/lib/auth/auth-session-store";
import { userHasAdminRole } from "@/lib/auth/user-roles.constants";
import { verifyJwtEdge } from "@/lib/auth/verify-jwt-edge";
import { problemTypes } from "@/lib/http/problem-details";
import { rateLimitBackendUnavailableResponse } from "@/lib/http/rate-limit-backend";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { resolveUpstashRestCredentials } from "@/lib/redis/upstash-config";

function unauthorizedAdminApiResponse(): NextResponse {
  return NextResponse.json(
    {
      type: problemTypes.unauthorized,
      title: "Unauthorized",
      status: 401,
      detail: "Missing or invalid Authorization header",
    },
    { status: 401 }
  );
}

function forbiddenAdminApiResponse(): NextResponse {
  return NextResponse.json(
    {
      type: problemTypes.forbidden,
      title: "Forbidden",
      status: 403,
      detail: "Admin access required",
    },
    { status: 403 }
  );
}

/** Protect /api/v1/admin/* — JWT, session claims, and signed admin role. */
async function requireAdminApiAuth(request: NextRequest): Promise<NextResponse | null> {
  const token = extractAuthTokenFromRequest(request);
  if (!token) {
    return unauthorizedAdminApiResponse();
  }

  const claims = await verifyJwtEdge(token);
  if (!claims) {
    return unauthorizedAdminApiResponse();
  }

  if (Array.isArray(claims.roles)) {
    if (!userHasAdminRole(claims.roles)) {
      return forbiddenAdminApiResponse();
    }
    return null;
  }

  const cachedRoles = await getCachedUserRoles(claims.userId);
  if (!userHasAdminRole(cachedRoles)) {
    return forbiddenAdminApiResponse();
  }

  return null;
}

/** Rate limit for auth endpoints (login/register) by IP */
async function checkAuthRateLimit(request: NextRequest): Promise<NextResponse | null> {
  const backendUnavailable = rateLimitBackendUnavailableResponse();
  if (backendUnavailable) {
    return backendUnavailable;
  }

  const credentials = resolveUpstashRestCredentials();
  if (!credentials) {
    return null;
  }

  const redis = new Redis(credentials);
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "60 s"),
    prefix: "ratelimit:auth",
  });

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const { success } = await ratelimit.limit(ip);
  if (!success) {
    return NextResponse.json(
      {
        type: problemTypes.tooManyRequests,
        title: "Too Many Requests",
        status: 429,
        detail: "Too many login/register attempts. Try again later.",
      },
      { status: 429 }
    );
  }
  return null;
}

async function checkPublicApiRateLimit(request: NextRequest): Promise<NextResponse | null> {
  const backendUnavailable = rateLimitBackendUnavailableResponse();
  if (backendUnavailable) {
    return backendUnavailable;
  }

  const credentials = resolveUpstashRestCredentials();
  if (!credentials) {
    return null;
  }

  const redis = new Redis(credentials);
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "60 s"),
    prefix: "ratelimit:public-api",
  });

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const pathname = request.nextUrl.pathname;
  const { success } = await ratelimit.limit(`${ip}:${pathname}`);
  if (!success) {
    return NextResponse.json(
      {
        type: problemTypes.tooManyRequests,
        title: "Too Many Requests",
        status: 429,
        detail: "Too many requests for this endpoint. Try again later.",
      },
      { status: 429, headers: { "Retry-After": "15" } }
    );
  }
  return null;
}

/** CORS: allowed origin from env. For /api/* requests add CORS headers and handle preflight. */
function getAllowedOrigins(): string[] {
  const configuredOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.APP_URL?.trim();
  const defaults =
    process.env.NODE_ENV === "development"
      ? ["http://localhost:3000", "http://127.0.0.1:3000"]
      : [];
  return [...new Set([...configuredOrigins, ...(appUrl ? [appUrl] : []), ...defaults])];
}

function getCorsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function resolveAllowedOrigin(request: NextRequest): string | null {
  const requestOrigin = request.headers.get("origin");
  if (!requestOrigin) {
    return null;
  }
  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.includes(requestOrigin) ? requestOrigin : null;
}

function applyCorsHeaders(response: NextResponse, allowedOrigin: string | null): void {
  if (!allowedOrigin) {
    return;
  }
  const corsHeaders = getCorsHeaders(allowedOrigin);
  Object.entries(corsHeaders).forEach(([key, value]) => response.headers.set(key, value));
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api/")) {
    const allowedOrigin = resolveAllowedOrigin(request);
    if (request.method === "OPTIONS") {
      if (!allowedOrigin) {
        return NextResponse.json(
          {
            type: problemTypes.forbidden,
            title: "Forbidden",
            status: 403,
            detail: "Origin is not allowed by CORS policy",
          },
          { status: 403 }
        );
      }
      return new NextResponse(null, { status: 204, headers: getCorsHeaders(allowedOrigin) });
    }
    const response = NextResponse.next();
    applyCorsHeaders(response, allowedOrigin);

    if (pathname.startsWith("/api/v1/admin/")) {
      const authRes = await requireAdminApiAuth(request);
      if (authRes) {
        applyCorsHeaders(authRes, allowedOrigin);
        return authRes;
      }
    } else if (
      (pathname === "/api/v1/auth/login" || pathname === "/api/v1/auth/register") &&
      request.method === "POST"
    ) {
      const rateLimitResponse = await checkAuthRateLimit(request);
      if (rateLimitResponse) {
        applyCorsHeaders(rateLimitResponse, allowedOrigin);
        return rateLimitResponse;
      }
    }
    if (
      request.method === "POST" &&
      (pathname === "/api/v1/contact" ||
        pathname === "/api/v1/orders/checkout" ||
        pathname === "/api/v1/cart/items")
    ) {
      const endpointLimitResponse = await checkPublicApiRateLimit(request);
      if (endpointLimitResponse) {
        applyCorsHeaders(endpointLimitResponse, allowedOrigin);
        return endpointLimitResponse;
      }
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/v1/admin/:path*",
    "/api/v1/auth/login",
    "/api/v1/auth/register",
    "/api/v1/:path*",
    "/api/health",
  ],
};
