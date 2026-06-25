import type { NextRequest, NextResponse } from 'next/server';
import { PASSWORD_RESET_TOKEN_TTL_MS } from '@/lib/auth/password-reset.constants';

export const PASSWORD_RESET_COOKIE = 'password_reset_token';

const RESET_COOKIE_MAX_AGE_SECONDS = Math.floor(PASSWORD_RESET_TOKEN_TTL_MS / 1000);

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

function resetCookieOptions(maxAge: number) {
  return {
    path: '/',
    sameSite: 'strict' as const,
    secure: isProduction(),
    httpOnly: true,
    maxAge,
  };
}

/** Reads the password reset token from the HttpOnly cookie. */
export function extractPasswordResetTokenFromRequest(request: NextRequest): string | null {
  const value = request.cookies.get(PASSWORD_RESET_COOKIE)?.value;
  return value && value.length > 0 ? value : null;
}

/** Stores the reset token in an HttpOnly cookie for the reset form step. */
export function setPasswordResetCookieOnResponse(
  response: NextResponse,
  rawToken: string,
): void {
  response.cookies.set(
    PASSWORD_RESET_COOKIE,
    rawToken,
    resetCookieOptions(RESET_COOKIE_MAX_AGE_SECONDS),
  );
}

/** Clears the password reset cookie after use or on failure. */
export function clearPasswordResetCookieOnResponse(response: NextResponse): void {
  response.cookies.set(PASSWORD_RESET_COOKIE, '', resetCookieOptions(0));
}
