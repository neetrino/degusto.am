import type { Cart } from '@/app/cart/types';
import { getStoredCurrency } from '@/lib/currency';
import { createEmptyClientCart } from '@/lib/cart/cart-client-normalization';

const EMPTY_CART_TOTALS = {
  subtotal: 0,
  discount: 0,
  shipping: 0,
  tax: 0,
  total: 0,
} as const;

/** Placeholder cart for instant empty UI while the API reconciles. */
export function createEmptyCart(): Cart {
  const cart = createEmptyClientCart(getStoredCurrency());
  return {
    ...cart,
    totals: {
      ...EMPTY_CART_TOTALS,
      currency: cart.totals.currency,
    },
  };
}
