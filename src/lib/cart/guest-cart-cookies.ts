import { randomUUID } from "crypto";
import type { NextRequest, NextResponse } from "next/server";

export const GUEST_CART_TOKEN_COOKIE = "guest_cart_token";

/** Guest cart lifetime — matches Cart.expiresAt window (30 days). */
const GUEST_CART_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

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

export function createGuestCartToken(): string {
  return randomUUID();
}

export function extractGuestCartToken(request: NextRequest): string | null {
  const value = request.cookies.get(GUEST_CART_TOKEN_COOKIE)?.value?.trim();
  return value || null;
}

export function setGuestCartTokenOnResponse(
  response: NextResponse,
  token: string
): void {
  response.cookies.set(GUEST_CART_TOKEN_COOKIE, token, {
    ...baseCookieOptions(GUEST_CART_MAX_AGE_SECONDS),
    httpOnly: true,
  });
}

export function clearGuestCartTokenOnResponse(response: NextResponse): void {
  response.cookies.set(GUEST_CART_TOKEN_COOKIE, "", {
    ...baseCookieOptions(0),
    httpOnly: true,
  });
}

/** Removes legacy client-side shop data after migration to database persistence. */
export function clearLegacyShopLocalStorage(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.removeItem("shop_cart_guest");
    localStorage.removeItem("shop_wishlist");
  } catch {
    // Ignore storage errors
  }
}

/** @deprecated Use clearLegacyShopLocalStorage */
export function clearLegacyGuestCartLocalStorage(): void {
  clearLegacyShopLocalStorage();
}
