import { NextRequest, NextResponse } from 'next/server';
import { problemTypes } from '@/lib/http/problem-details';
import { parseRouteCatchError } from '@/lib/http/api-route-errors';
import { authenticateToken, requireAdmin } from '@/lib/middleware/auth';
import {
  getDailyOfferSelection,
  toggleDailyOfferProduct,
} from '@/lib/services/daily-offer/daily-offer.service';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

async function requireAdminUser(req: NextRequest) {
  const user = await authenticateToken(req);
  if (!user || !requireAdmin(user)) {
    return null;
  }
  return user;
}

/**
 * GET /api/v1/admin/daily-offers
 * Returns active daily-offer product IDs per platform.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireAdminUser(req);
    if (!user) {
      return NextResponse.json(
        {
          type: problemTypes.forbidden,
          title: 'Forbidden',
          status: 403,
          detail: 'Admin access required',
          instance: req.url,
        },
        { status: 403 }
      );
    }

    const selection = await getDailyOfferSelection();
    return NextResponse.json(selection);
  } catch (error: unknown) {
    logger.error('Admin daily-offer fetch failed', { error });
    const apiError = parseRouteCatchError(error);
    return NextResponse.json(
      {
        type: apiError.type ?? problemTypes.internalError,
        title: apiError.title ?? 'Internal Server Error',
        status: apiError.status ?? 500,
        detail: apiError.detail ?? apiError.message ?? 'An error occurred',
        instance: req.url,
      },
      { status: apiError.status ?? 500 }
    );
  }
}

/**
 * PUT /api/v1/admin/daily-offers
 * Toggle the persistent daily-offer product for mobile and desktop.
 */
export async function PUT(req: NextRequest) {
  try {
    const user = await requireAdminUser(req);
    if (!user) {
      return NextResponse.json(
        {
          type: problemTypes.forbidden,
          title: 'Forbidden',
          status: 403,
          detail: 'Admin access required',
          instance: req.url,
        },
        { status: 403 }
      );
    }

    const body = (await req.json()) as Record<string, unknown>;
    if (typeof body.productId !== 'string') {
      return NextResponse.json(
        {
          type: problemTypes.validationError,
          title: 'Validation Error',
          status: 400,
          detail: 'productId is required',
          instance: req.url,
        },
        { status: 400 }
      );
    }

    const selection = await toggleDailyOfferProduct(body.productId);
    return NextResponse.json(selection);
  } catch (error: unknown) {
    logger.error('Admin daily-offer toggle failed', { error });
    const apiError = parseRouteCatchError(error);
    const status = apiError.message?.includes('not found') ? 404 : apiError.status ?? 500;

    return NextResponse.json(
      {
        type: status === 404 ? problemTypes.notFound : apiError.type ?? problemTypes.internalError,
        title: status === 404 ? 'Not Found' : apiError.title ?? 'Internal Server Error',
        status,
        detail: apiError.detail ?? apiError.message ?? 'An error occurred',
        instance: req.url,
      },
      { status }
    );
  }
}
