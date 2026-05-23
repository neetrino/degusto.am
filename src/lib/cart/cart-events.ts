import { writeCartSummaryCache } from '../cartSummaryCache';

export interface CartUpdatedDetail {
  itemsCount?: number;
  total?: number;
  forceReload?: boolean;
  optimisticAdd?: {
    quantity?: number;
    price?: number;
  };
}

export function parseCartUpdatedDetail(event: Event): CartUpdatedDetail | undefined {
  return (event as CustomEvent<CartUpdatedDetail>).detail;
}

/** Broadcast cart summary to header/badge listeners without triggering a full cart fetch. */
export function publishCartUpdated(itemsCount: number, total: number): void {
  writeCartSummaryCache(itemsCount, total);
  window.dispatchEvent(
    new CustomEvent<CartUpdatedDetail>('cart-updated', {
      detail: { itemsCount, total },
    })
  );
}

/** Request a full cart reload (e.g. after API error recovery). */
export function publishCartForceReload(): void {
  window.dispatchEvent(
    new CustomEvent<CartUpdatedDetail>('cart-updated', {
      detail: { forceReload: true },
    })
  );
}
