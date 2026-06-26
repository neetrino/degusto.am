import type { Cart } from '@/app/cart/types';
import { cartService } from '@/lib/services/cart.service';
import { usersService } from '@/lib/services/users.service';

export type StorefrontCommerceState = {
  cart: Cart | null;
  wishlistIds: string[];
};

type LoadStorefrontCommerceStateInput = {
  userId: string | null;
  locale: string;
  guestToken: string | null;
};

/**
 * Resolves cart and wishlist in one handler to cap concurrent HTTP + auth overhead.
 * Cart is summary-only (counts/totals); drawer/checkout load full cart on demand.
 */
export async function loadStorefrontCommerceState(
  input: LoadStorefrontCommerceStateInput
): Promise<StorefrontCommerceState> {
  const { userId, locale, guestToken } = input;

  const [cartResult, wishlistResult] = await Promise.all([
    userId || guestToken
      ? cartService.getCartSummary(userId, locale, guestToken)
      : Promise.resolve({ cart: null }),
    userId ? usersService.getWishlistIds(userId) : Promise.resolve({ ids: [] as string[] }),
  ]);

  return {
    cart: cartResult.cart ?? null,
    wishlistIds: wishlistResult.ids,
  };
}
