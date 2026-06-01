import type { NextRequest, NextResponse } from "next/server";
import { jwtExpiresInToMaxAgeSeconds } from "@/lib/auth/jwt-expires-in";

export const AUTH_TOKEN_COOKIE = "auth_token";
export const AUTH_USER_COOKIE = "auth_user";

export interface AuthCookieUser {
  id: string;
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  roles?: string[];
}

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function baseCookieOptions(maxAge: number) {
  return {
    path: "/",
    sameSite: "lax" as const,
    secure: isProduction(),
    maxAge,
  };
}

/**
 * Reads JWT from Authorization header or HttpOnly cookie.
 */
export function extractAuthTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  const legacyBearer = authHeader?.split(" ")[1];
  if (legacyBearer) {
    return legacyBearer;
  }
  return request.cookies.get(AUTH_TOKEN_COOKIE)?.value ?? null;
}

/**
 * Sets HttpOnly JWT cookie and readable user profile cookie on an API response.
 */
export function setAuthCookiesOnResponse(
  response: NextResponse,
  token: string,
  user: AuthCookieUser
): void {
  const maxAge = jwtExpiresInToMaxAgeSeconds();
  const base = baseCookieOptions(maxAge);

  response.cookies.set(AUTH_TOKEN_COOKIE, token, {
    ...base,
    httpOnly: true,
  });

  response.cookies.set(AUTH_USER_COOKIE, encodeURIComponent(JSON.stringify(user)), {
    ...base,
    httpOnly: false,
  });
}

/**
 * Clears auth cookies on an API response.
 */
export function clearAuthCookiesOnResponse(response: NextResponse): void {
  const base = baseCookieOptions(0);
  response.cookies.set(AUTH_TOKEN_COOKIE, "", { ...base, httpOnly: true });
  response.cookies.set(AUTH_USER_COOKIE, "", { ...base, httpOnly: false });
}

function getClientCookieValue(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Parses stored user profile from the auth_user cookie.
 */
export function getAuthUserFromClientCookie(): AuthCookieUser | null {
  try {
    const raw = getClientCookieValue(AUTH_USER_COOKIE);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as AuthCookieUser;
    if (!parsed?.id) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Whether the client has a stored auth user (JWT may be HttpOnly).
 */
export function hasClientAuthSession(): boolean {
  return getAuthUserFromClientCookie() !== null;
}

/**
 * Clears readable auth cookies in the browser.
 */
export function clearClientAuthCookies(): void {
  if (typeof document === "undefined") {
    return;
  }
  const secure = isProduction() ? "; secure" : "";
  document.cookie = `${AUTH_TOKEN_COOKIE}=; path=/; max-age=0; samesite=lax${secure}`;
  document.cookie = `${AUTH_USER_COOKIE}=; path=/; max-age=0; samesite=lax${secure}`;
}

/**
 * Persists user profile in a readable cookie (JWT remains HttpOnly).
 */
export function setAuthUserClientCookie(user: AuthCookieUser): void {
  if (typeof document === "undefined") {
    return;
  }
  const maxAge = jwtExpiresInToMaxAgeSeconds();
  const secure = isProduction() ? "; secure" : "";
  document.cookie = `${AUTH_USER_COOKIE}=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=${maxAge}; samesite=lax${secure}`;
}

/** Removes legacy localStorage auth keys after migration to cookies. */
export function clearLegacyAuthLocalStorage(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.removeItem(AUTH_TOKEN_COOKIE);
    localStorage.removeItem(AUTH_USER_COOKIE);
  } catch {
    // Ignore storage errors
  }
}
