import {
  clearCartSummaryCache,
  readCartSummaryCache,
  writeCartSummaryCache,
} from '../cartSummaryCache';
import type { CartAddSnapshot } from './optimistic-cart-add';

export interface CartUpdatedDetail {
  itemsCount?: number;
  total?: number;
  forceReload?: boolean;
  /** Do not refetch cart from server (e.g. after optimistic remove). */
  skipReconcile?: boolean;
  optimisticAdd?: {
    quantity?: number;
    price?: number;
  };
  /** Minimal product snapshot for instant drawer updates before API confirms. */
  addedItem?: CartAddSnapshot;
}

export type { CartAddSnapshot };

export function parseCartUpdatedDetail(event: Event): CartUpdatedDetail | undefined {
  return (event as CustomEvent<CartUpdatedDetail>).detail;
}

/** Broadcast cart summary to header/badge listeners without triggering a full cart fetch. */
export function publishCartUpdated(
  itemsCount: number,
  total: number,
  options?: { skipReconcile?: boolean }
): void {
  writeCartSummaryCache(itemsCount, total);
  window.dispatchEvent(
    new CustomEvent<CartUpdatedDetail>('cart-updated', {
      detail: {
        itemsCount,
        total,
        skipReconcile: options?.skipReconcile ?? false,
      },
    })
  );
}

/** Instant badge + drawer feedback before the cart API responds. */
export function publishOptimisticCartAdd(snapshot: CartAddSnapshot): void {
  const cached = readCartSummaryCache();
  const nextCount = (cached?.itemsCount ?? 0) + snapshot.quantity;
  const nextTotal = (cached?.total ?? 0) + snapshot.price * snapshot.quantity;
  writeCartSummaryCache(nextCount, nextTotal);
  window.dispatchEvent(
    new CustomEvent<CartUpdatedDetail>('cart-updated', {
      detail: {
        optimisticAdd: { quantity: snapshot.quantity, price: snapshot.price },
        addedItem: snapshot,
        itemsCount: nextCount,
        total: nextTotal,
      },
    })
  );
}

/** Apply header/badge counts from a cart-updated event (avoids double-counting optimistic adds). */
export function applyCartBadgeFromDetail(
  detail: CartUpdatedDetail | undefined,
  apply: (itemsCount: number, total: number) => void
): 'handled' | 'force-reload' | 'miss' {
  if (detail?.forceReload) {
    return 'force-reload';
  }

  if (detail?.itemsCount !== undefined && detail?.total !== undefined) {
    apply(detail.itemsCount, detail.total);
    return 'handled';
  }

  return 'miss';
}

/** Clear cached header totals and broadcast an empty cart to all listeners. */
export function resetCartBadgeState(): void {
  if (typeof window === 'undefined') {
    return;
  }
  clearCartSummaryCache();
  publishCartUpdated(0, 0, { skipReconcile: true });
}

/** Request a full cart reload (e.g. after API error recovery). */
export function publishCartForceReload(): void {
  window.dispatchEvent(
    new CustomEvent<CartUpdatedDetail>('cart-updated', {
      detail: { forceReload: true },
    })
  );
}
