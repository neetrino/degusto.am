import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken, requireAdmin } from '@/lib/middleware/auth';
import { writeAdminAuditLog } from '@/lib/admin/admin-audit-log.service';
import { problemTypes } from '@/lib/http/problem-details';
import { safeParseMfaDisable } from '@/lib/schemas/mfa.schema';
import { mfaService } from '@/lib/services/mfa.service';
import { toApiError } from '@/lib/types/errors';
import { logger } from '@/lib/utils/logger';

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      return NextResponse.json(
        {
          type: problemTypes.forbidden,
          title: 'Forbidden',
          status: 403,
          detail: 'Admin access required',
          instance: req.url,
        },
        { status: 403 },
      );
    }

    const body = await req.json();
    const parsed = safeParseMfaDisable(body);
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

    const result = await mfaService.disable(user.id, parsed.data.code);
    await writeAdminAuditLog({
      actorId: user.id,
      action: 'mfa.disable',
      targetType: 'user',
      targetId: user.id,
    });
    return NextResponse.json(result);
  } catch (error: unknown) {
    logger.error('[MFA DISABLE] Error', { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}
