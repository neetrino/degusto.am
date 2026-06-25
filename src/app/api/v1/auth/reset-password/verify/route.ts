import { NextRequest, NextResponse } from 'next/server';
import {
  clearPasswordResetCookieOnResponse,
  extractPasswordResetTokenFromRequest,
  setPasswordResetCookieOnResponse,
} from '@/lib/auth/password-reset-cookie';
import { problemTypes } from '@/lib/http/problem-details';
import { passwordResetService } from '@/lib/services/password-reset.service';
import { logger } from '@/lib/utils/logger';

/**
 * Exchanges a reset link token for an HttpOnly cookie, then redirects to the form.
 * Keeps the raw token out of browser history and the reset page URL.
 */
export async function GET(req: NextRequest) {
  const rawToken = req.nextUrl.searchParams.get('token')?.trim() ?? '';
  const resetPageUrl = new URL('/reset-password', req.nextUrl.origin);

  if (!rawToken) {
    resetPageUrl.searchParams.set('error', 'invalid');
    return NextResponse.redirect(resetPageUrl);
  }

  try {
    const isValid = await passwordResetService.validateResetToken(rawToken);
    if (!isValid) {
      resetPageUrl.searchParams.set('error', 'invalid');
      return NextResponse.redirect(resetPageUrl);
    }

    const response = NextResponse.redirect(resetPageUrl);
    setPasswordResetCookieOnResponse(response, rawToken);
    return response;
  } catch (error: unknown) {
    logger.error('[RESET PASSWORD VERIFY] Error', { error });
    resetPageUrl.searchParams.set('error', 'invalid');
    return NextResponse.redirect(resetPageUrl);
  }
}

export async function DELETE(_req: NextRequest) {
  const response = NextResponse.json({ ok: true });
  clearPasswordResetCookieOnResponse(response);
  return response;
}
