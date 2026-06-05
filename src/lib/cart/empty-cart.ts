import type { Cart } from '@/app/cart/types';
import { getStoredCurrency } from '@/lib/currency';

const EMPTY_CART_TOTALS = {
  subtotal: 0,
  discount: 0,
  shipping: 0,
  tax: 0,
  total: 0,
} as const;

/** Placeholder cart for instant empty UI while the API reconciles. */
export function createEmptyCart(): Cart {
  return {
    id: '',
    items: [],
    itemsCount: 0,
    totals: {
      ...EMPTY_CART_TOTALS,
      currency: getStoredCurrency(),
    },
  };
}
