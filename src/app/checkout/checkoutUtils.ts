import { finalizeCartAfterCheckout } from '../../lib/cart/cart-events';

/** @deprecated Use finalizeCartAfterCheckout */
export function clearGuestCart(): void {
  finalizeCartAfterCheckout();
}
