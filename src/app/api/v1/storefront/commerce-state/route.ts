import { NextRequest, NextResponse } from 'next/server';
import { apiRouteCatchErrorResponse } from '@/lib/http/api-route-errors';
import { resolveCartRequestContext } from '@/lib/cart/cart-request-context';
import { loadStorefrontCommerceState } from '@/lib/services/storefront/storefront-commerce-state.service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/storefront/commerce-state
 * Bootstrap cart + wishlist + compare for storefront chrome (header badges, drawer).
 */
export async function GET(req: NextRequest) {
  try {
    const { user, locale, guestToken } = await resolveCartRequestContext(req);
    const state = await loadStorefrontCommerceState({
      userId: user?.id ?? null,
      locale,
      guestToken,
    });
    return NextResponse.json(state);
  } catch (error: unknown) {
    return apiRouteCatchErrorResponse(req, error, '[STOREFRONT] commerce-state GET');
  }
}
