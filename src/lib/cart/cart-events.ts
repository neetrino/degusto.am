import {
  clearCartSummaryCache,
  readCartSummaryCache,
  writeCartSummaryCache,
} from '../cartSummaryCache';
import { clearCartSnapshotCache } from './cart-snapshot-cache';
import type { CartAddSnapshot, CartLineConfirmation } from './optimistic-cart-add';

const FORCE_RELOAD_MIN_GAP_MS = 2000;
let lastCartForceReloadAt = 0;

export const CART_CHECKOUT_COMPLETED_KEY = 'shop_cart_checkout_completed_at';
const CHECKOUT_CART_STALE_MS = 60 * 60 * 1000;

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
  /** Server row after POST /cart/items — replaces optimistic line ids in drawer state. */
  confirmedLine?: CartLineConfirmation;
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
        skipReconcile: true,
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

/** Replace optimistic drawer line with the persisted cart item (no full refetch). */
export function publishCartLineConfirmed(
  confirmation: CartLineConfirmation,
  summary: { itemsCount: number; total: number }
): void {
  writeCartSummaryCache(summary.itemsCount, summary.total);
  window.dispatchEvent(
    new CustomEvent<CartUpdatedDetail>('cart-updated', {
      detail: {
        confirmedLine: confirmation,
        itemsCount: summary.itemsCount,
        total: summary.total,
        skipReconcile: true,
      },
    })
  );
}

/** Request a full cart reload (e.g. after API error recovery). */
export function publishCartForceReload(options?: { immediate?: boolean }): void {
  const now = Date.now();
  if (!options?.immediate && now - lastCartForceReloadAt < FORCE_RELOAD_MIN_GAP_MS) {
    return;
  }
  lastCartForceReloadAt = now;

  window.dispatchEvent(
    new CustomEvent<CartUpdatedDetail>('cart-updated', {
      detail: { forceReload: true },
    })
  );
}

export function wasCartCheckoutRecentlyCompleted(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const raw = sessionStorage.getItem(CART_CHECKOUT_COMPLETED_KEY);
  if (!raw) {
    return false;
  }
  const completedAt = Number(raw);
  if (!Number.isFinite(completedAt)) {
    sessionStorage.removeItem(CART_CHECKOUT_COMPLETED_KEY);
    return false;
  }
  const isRecent = Date.now() - completedAt < CHECKOUT_CART_STALE_MS;
  if (!isRecent) {
    sessionStorage.removeItem(CART_CHECKOUT_COMPLETED_KEY);
  }
  return isRecent;
}

export function clearRecentCheckoutFlag(): void {
  if (typeof window === 'undefined') {
    return;
  }
  sessionStorage.removeItem(CART_CHECKOUT_COMPLETED_KEY);
}

/** Clear all client cart caches and request a server reconcile after checkout. */
export function finalizeCartAfterCheckout(): void {
  if (typeof window === 'undefined') {
    return;
  }
  clearCartSummaryCache();
  clearCartSnapshotCache();
  sessionStorage.setItem(CART_CHECKOUT_COMPLETED_KEY, String(Date.now()));
  lastCartForceReloadAt = Date.now();
  window.dispatchEvent(
    new CustomEvent<CartUpdatedDetail>('cart-updated', {
      detail: {
        itemsCount: 0,
        total: 0,
        skipReconcile: true,
        forceReload: true,
      },
    })
  );
}
