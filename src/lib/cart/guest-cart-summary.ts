import { CART_KEY } from '@/app/cart/constants';

interface GuestCartSummaryItem {
  quantity: number;
  price?: number;
}

/** Compute guest cart badge totals from localStorage (no API). */
export function computeGuestCartSummary(): { itemsCount: number; total: number } {
  if (typeof window === 'undefined') {
    return { itemsCount: 0, total: 0 };
  }

  try {
    const stored = localStorage.getItem(CART_KEY);
    const cart: GuestCartSummaryItem[] = stored ? JSON.parse(stored) : [];
    const itemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0);
    return { itemsCount, total };
  } catch {
    return { itemsCount: 0, total: 0 };
  }
}
