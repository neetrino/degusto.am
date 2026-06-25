import { apiClient } from '../../lib/api-client';
import type { Cart } from './types';
import { publishCartForceReload } from '../../lib/cart/cart-events';

export async function fetchCartForGuest(): Promise<Cart | null> {
  try {
    const response = await apiClient.get<{ cart: Cart | null }>('/api/v1/cart');
    return response.cart;
  } catch {
    return null;
  }
}

/** Refetch cart drawer state after guest checkout (badge already cleared via resetCartBadgeState). */
export function clearGuestCart(): void {
  publishCartForceReload();
}
