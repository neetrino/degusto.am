import type { Cart } from '@/app/cart/types';
import { clearCartSummaryCache, writeCartSummaryCache } from '../cartSummaryCache';
import type { CartUpdatedDetail } from './cart-events';

/** Keep header badge and drawer cart on the same counts/totals. */
export function dispatchCartSummarySync(cart: Cart | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  const itemsCount = cart?.itemsCount ?? 0;
  const total = cart?.totals?.total ?? 0;
  if (itemsCount === 0) {
    clearCartSummaryCache();
    return;
  }
  writeCartSummaryCache(itemsCount, total);
  window.dispatchEvent(
    new CustomEvent<CartUpdatedDetail>('cart-updated', {
      detail: {
        itemsCount,
        total,
        skipReconcile: true,
      },
    })
  );
}

export function cartHasVisibleItems(cart: Cart | null): boolean {
  return (cart?.items.length ?? 0) > 0;
}
