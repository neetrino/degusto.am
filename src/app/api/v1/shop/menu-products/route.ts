import { NextRequest, NextResponse } from 'next/server';
import { apiRouteErrorResponse } from '@/lib/http/api-route-errors';
import {
  parseShopMenuSearchParams,
  toShopMenuProductsQuery,
} from '@/lib/services/shop-page/parse-shop-menu-search-params';
import { getShopMenuProductsPage } from '@/lib/services/shop-page/shop-page-data.service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = parseShopMenuSearchParams(searchParams);
    const products = await getShopMenuProductsPage(toShopMenuProductsQuery(parsed));

    return NextResponse.json(products, {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    return apiRouteErrorResponse(req, error, 'Failed to load shop menu products');
  }
}
