import { NextRequest, NextResponse } from 'next/server';
import { apiRouteErrorResponse } from '@/lib/http/api-route-errors';
import {
  parseShopMenuSearchParams,
  toShopMenuProductsQuery,
} from '@/lib/services/shop-page/parse-shop-menu-search-params';
import { getShopMenuProductsPageWithMetrics } from '@/lib/services/shop-page/shop-page-data.service';

export async function GET(req: NextRequest) {
  const startedAt = Date.now();
  try {
    const { searchParams } = new URL(req.url);
    const parsed = parseShopMenuSearchParams(searchParams);
    const { data: products, metrics } = await getShopMenuProductsPageWithMetrics({
      ...toShopMenuProductsQuery(parsed),
      menuFast: true,
    });
    const totalMs = Date.now() - startedAt;

    return NextResponse.json(products, {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
        'x-shop-api-total-ms': String(totalMs),
        'x-shop-service-ms': String(metrics.totalServiceMs),
      },
    });
  } catch (error) {
    return apiRouteErrorResponse(req, error, 'Failed to load shop menu products');
  }
}
