import { NextRequest, NextResponse } from 'next/server';
import { setAuthCookiesOnResponse } from '@/lib/auth/auth-cookies';
import { extractGuestCartToken, clearGuestCartTokenOnResponse } from '@/lib/cart/guest-cart-cookies';
import { problemTypes } from '@/lib/http/problem-details';
import { enforceRouteRateLimit } from '@/lib/http/route-rate-limit';
import { safeParseMfaVerify } from '@/lib/schemas/mfa.schema';
import { cartService } from '@/lib/services/cart.service';
import { mfaService } from '@/lib/services/mfa.service';
import { toApiError } from '@/lib/types/errors';
import { logger } from '@/lib/utils/logger';

export async function POST(req: NextRequest) {
  try {
    const rateLimited = await enforceRouteRateLimit(req, {
      prefix: 'ratelimit:mfa-verify',
      limit: 10,
      window: '60 s',
      detail: 'Too many MFA attempts. Try again later.',
    });
    if (rateLimited) {
      return rateLimited;
    }

    const body = await req.json();
    const parsed = safeParseMfaVerify(body);
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

    const result = await mfaService.verifyChallenge(
      parsed.data.mfaToken,
      parsed.data.code,
    );
    const response = NextResponse.json({ user: result.user });
    setAuthCookiesOnResponse(response, result.token, result.user);

    const guestToken = extractGuestCartToken(req);
    if (guestToken) {
      try {
        await cartService.mergeGuestCartIntoUser(guestToken, result.user.id, 'en');
      } catch (mergeError: unknown) {
        logger.warn('[CART] Guest cart merge on MFA verify failed', { error: mergeError });
      }
      clearGuestCartTokenOnResponse(response);
    }

    return response;
  } catch (error: unknown) {
    logger.error('[MFA VERIFY] Error', { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}
