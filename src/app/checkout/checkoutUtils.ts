import { publishCartForceReload } from '../../lib/cart/cart-events';

/** Refetch cart drawer state after guest checkout (badge already cleared via resetCartBadgeState). */
export function clearGuestCart(): void {
  publishCartForceReload();
}
