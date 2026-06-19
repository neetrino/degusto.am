import { NextRequest, NextResponse } from 'next/server';
import { resolveStorefrontLocaleFromNextRequest } from '@/lib/i18n/locale';
import { apiRouteErrorResponse } from '@/lib/http/api-route-errors';
import { getComboMenuProductsPageWithMetrics } from '@/lib/services/combo-page/combo-page-data.service';
import {
  parseShopMenuSearchParams,
  toShopMenuProductsQuery,
} from '@/lib/services/shop-page/parse-shop-menu-search-params';
import { menuCardToProductCardApiJson } from '@/lib/storefront/product-card-dto';

export async function GET(req: NextRequest) {
  const startedAt = Date.now();
  try {
    const { searchParams } = new URL(req.url);
    const locale = resolveStorefrontLocaleFromNextRequest(req);
    const parsed = parseShopMenuSearchParams(searchParams, locale);
    const { data: products, metrics } = await getComboMenuProductsPageWithMetrics({
      ...toShopMenuProductsQuery(parsed),
      menuFast: true,
    });
    const totalMs = Date.now() - startedAt;

    return NextResponse.json(
      {
        cards: products.cards.map(menuCardToProductCardApiJson),
        effectivePage: products.effectivePage,
        totalPages: products.totalPages,
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
          'x-combo-api-total-ms': String(totalMs),
          'x-combo-service-ms': String(metrics.totalServiceMs),
        },
      }
    );
  } catch (error) {
    return apiRouteErrorResponse(req, error, 'Failed to load combo menu products');
  }
}
