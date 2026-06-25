import { NextRequest, NextResponse } from 'next/server';
import { problemTypes } from '@/lib/http/problem-details';
import { enforceRouteRateLimit } from '@/lib/http/route-rate-limit';
import { safeParseForgotPassword } from '@/lib/schemas/password-reset.schema';
import { passwordResetService } from '@/lib/services/password-reset.service';
import { toApiError } from '@/lib/types/errors';
import { logger } from '@/lib/utils/logger';

export async function POST(req: NextRequest) {
  try {
    const rateLimited = await enforceRouteRateLimit(req, {
      prefix: 'ratelimit:forgot-password',
      limit: 6,
      window: '60 s',
      detail: 'Too many password reset requests. Try again later.',
    });
    if (rateLimited) {
      return rateLimited;
    }

    const body = await req.json();
    const parsed = safeParseForgotPassword(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          type: problemTypes.validationError,
          title: 'Validation failed',
          status: 400,
          detail: parsed.error.issues[0]?.message ?? 'Invalid email',
          instance: req.url,
        },
        { status: 400 },
      );
    }

    const result = await passwordResetService.requestReset(parsed.data.email);
    return NextResponse.json(result);
  } catch (error: unknown) {
    logger.error('[FORGOT PASSWORD] Error', { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}
