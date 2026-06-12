import { NextRequest, NextResponse } from "next/server";
import { extractAuthTokenFromRequest } from "@/lib/auth/auth-cookies";
import { problemTypes } from "@/lib/http/problem-details";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import * as jose from "jose";
import { resolveUpstashRestCredentials } from "@/lib/redis/upstash-config";

/** Protect /api/v1/admin/* — require valid JWT (signature + expiry). DB check (blocked/deleted) remains in route. */
async function requireAdminAuth(request: NextRequest): Promise<NextResponse | null> {
  const token = extractAuthTokenFromRequest(request);

  if (!token) {
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

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return NextResponse.json(
      {
        type: problemTypes.internalError,
        title: "Internal Server Error",
        status: 500,
        detail: "Server configuration error",
      },
      { status: 500 }
    );
  }

  try {
    const key = new TextEncoder().encode(secret);
    await jose.jwtVerify(token, key);
    return null;
  } catch {
    return NextResponse.json(
      {
        type: problemTypes.unauthorized,
        title: "Unauthorized",
        status: 401,
        detail: "Invalid or expired token",
      },
      { status: 401 }
    );
  }
}

/** Rate limit for auth endpoints (login/register) by IP */
async function checkAuthRateLimit(request: NextRequest): Promise<NextResponse | null> {
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
    if (allowedOrigin) {
      const corsHeaders = getCorsHeaders(allowedOrigin);
      Object.entries(corsHeaders).forEach(([key, value]) => response.headers.set(key, value));
    }
    // Run auth/rate-limit for protected paths, then return response with CORS
    if (pathname.startsWith("/api/v1/admin/")) {
      const authRes = await requireAdminAuth(request);
      if (authRes) {
        if (allowedOrigin) {
          const corsHeaders = getCorsHeaders(allowedOrigin);
          Object.entries(corsHeaders).forEach(([k, v]) => authRes.headers.set(k, v));
        }
        return authRes;
      }
    } else if (
      (pathname === "/api/v1/auth/login" || pathname === "/api/v1/auth/register") &&
      request.method === "POST"
    ) {
      const rateLimitResponse = await checkAuthRateLimit(request);
      if (rateLimitResponse) {
        if (allowedOrigin) {
          const corsHeaders = getCorsHeaders(allowedOrigin);
          Object.entries(corsHeaders).forEach(([k, v]) => rateLimitResponse.headers.set(k, v));
        }
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
        if (allowedOrigin) {
          const corsHeaders = getCorsHeaders(allowedOrigin);
          Object.entries(corsHeaders).forEach(([k, v]) => endpointLimitResponse.headers.set(k, v));
        }
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
