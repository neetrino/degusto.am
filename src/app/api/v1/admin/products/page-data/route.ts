import { NextRequest, NextResponse } from 'next/server';
import { problemTypes } from '@/lib/http/problem-details';
import { parseRouteCatchError } from '@/lib/http/api-route-errors';
import { authenticateToken, requireAdmin } from '@/lib/middleware/auth';
import { loadAdminProductsPageData } from '@/lib/services/admin/admin-products-page-data.service';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/admin/products/page-data
 * Bootstrap payload for the products list page (categories + daily-offer selection).
 */
export async function GET(req: NextRequest) {
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
        { status: 403 }
      );
    }

    const locale = req.nextUrl.searchParams.get('locale') ?? undefined;
    const data = await loadAdminProductsPageData(locale);
    return NextResponse.json(data);
  } catch (error: unknown) {
    logger.error('Admin products page-data failed', { error });
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
