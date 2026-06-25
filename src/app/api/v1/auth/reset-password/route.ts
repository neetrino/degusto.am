import { NextRequest, NextResponse } from 'next/server';
import { setAuthCookiesOnResponse } from '@/lib/auth/auth-cookies';
import {
  clearPasswordResetCookieOnResponse,
  extractPasswordResetTokenFromRequest,
} from '@/lib/auth/password-reset-cookie';
import { problemTypes } from '@/lib/http/problem-details';
import { enforceRouteRateLimit } from '@/lib/http/route-rate-limit';
import { safeParseResetPassword } from '@/lib/schemas/password-reset.schema';
import { passwordResetService } from '@/lib/services/password-reset.service';
import { toApiError } from '@/lib/types/errors';
import { logger } from '@/lib/utils/logger';

export async function POST(req: NextRequest) {
  try {
    const rateLimited = await enforceRouteRateLimit(req, {
      prefix: 'ratelimit:reset-password',
      limit: 8,
      window: '60 s',
      detail: 'Too many reset attempts. Try again later.',
    });
    if (rateLimited) {
      return rateLimited;
    }

    const body = await req.json();
    const parsed = safeParseResetPassword(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          type: problemTypes.validationError,
          title: 'Validation failed',
          status: 400,
          detail: parsed.error.issues[0]?.message ?? 'Invalid payload',
          instance: req.url,
        },
        { status: 400 },
      );
    }

    const resetToken =
      extractPasswordResetTokenFromRequest(req) ?? parsed.data.token?.trim() ?? '';
    if (!resetToken) {
      return NextResponse.json(
        {
          type: problemTypes.validationError,
          title: 'Invalid or expired token',
          status: 400,
          detail: 'Password reset link is invalid or has expired',
          instance: req.url,
        },
        { status: 400 },
      );
    }

    const result = await passwordResetService.resetPassword(
      resetToken,
      parsed.data.password,
    );

    if (result.kind === 'mfa_required') {
      const response = NextResponse.json({
        requiresMfa: true,
        mfaToken: result.mfaToken,
      });
      clearPasswordResetCookieOnResponse(response);
      return response;
    }

    const response = NextResponse.json({ user: result.user });
    setAuthCookiesOnResponse(response, result.token, result.user);
    clearPasswordResetCookieOnResponse(response);
    return response;
  } catch (error: unknown) {
    logger.error('[RESET PASSWORD] Error', { error });
    const apiError = toApiError(error, req.url);
    const response = NextResponse.json(apiError, { status: apiError.status || 500 });
    clearPasswordResetCookieOnResponse(response);
    return response;
  }
}
