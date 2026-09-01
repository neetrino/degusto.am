import type { CartDrawerView } from "@/features/cart/get-cart-drawer-view";
import {
  emptyCartShipping,
  localCartItemId,
  recomputeCartLocalView,
  withFormattedCartItem,
} from "@/features/cart/client/cart-local-format";
import type {
  CartLocalItem,
  CartLocalView,
  CartProductSnapshot,
} from "@/features/cart/client/cart-local-types";
import type { Currency } from "@/lib/money/currency";
import type { Locale } from "@/lib/i18n/config";

export const CART_LOCAL_STORAGE_KEY = "degusto.cart.drawer.v1";

export type {
  CartLocalItem,
  CartLocalView,
  CartProductSnapshot,
} from "@/features/cart/client/cart-local-types";
export { toCartDrawerView } from "@/features/cart/client/cart-local-types";

type Listener = () => void;

const listeners = new Set<Listener>();
let pendingMutations = 0;
let memoryView: CartLocalView | null | undefined;

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeCartLocalCache(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getCartPendingMutations(): number {
  return pendingMutations;
}

export function beginCartMutation(): void {
  pendingMutations += 1;
  emit();
}

export function endCartMutation(): void {
  pendingMutations = Math.max(0, pendingMutations - 1);
  emit();
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function parseStoredView(raw: string): CartLocalView | null {
  try {
    const parsed = JSON.parse(raw) as CartLocalView;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray(parsed.items) ||
      typeof parsed.itemCount !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** Reads the optimistic cart snapshot (memory → localStorage). */
export function readCartLocalView(): CartLocalView | null {
  if (memoryView !== undefined) {
    return memoryView;
  }
  if (!isBrowser()) {
    memoryView = null;
    return null;
  }
  const raw = window.localStorage.getItem(CART_LOCAL_STORAGE_KEY);
  memoryView = raw ? parseStoredView(raw) : null;
  return memoryView;
}

function persist(view: CartLocalView | null): void {
  memoryView = view;
  if (!isBrowser()) {
    emit();
    return;
  }
  if (view == null) {
    window.localStorage.removeItem(CART_LOCAL_STORAGE_KEY);
  } else {
    window.localStorage.setItem(CART_LOCAL_STORAGE_KEY, JSON.stringify(view));
  }
  emit();
}

/**
 * Replaces the local cache with the durable cart drawer payload.
 * Skips stale server snapshots while a mutation is in flight and the
 * optimistic cache already shows more items — unless `force` is set.
 */
export function replaceCartLocalFromServer(
  view: CartDrawerView,
  locale: Locale,
  currency: Currency,
  options?: { force?: boolean },
): void {
  const local = readCartLocalView();
  if (
    !options?.force &&
    pendingMutations > 0 &&
    local &&
    local.locale === locale &&
    local.currency === currency &&
    local.itemCount > view.itemCount
  ) {
    return;
  }

  const items: CartLocalItem[] = view.items.map((item) =>
    withFormattedCartItem(
      {
        id: item.id,
        productId: item.productId,
        title: item.title,
        quantity: item.quantity,
        imageUrl: item.imageUrl,
        unitAmount: item.unitAmount,
        unitPriceFormatted: item.unitPriceFormatted,
        lineTotalFormatted: item.lineTotalFormatted,
      },
      currency,
      locale,
    ),
  );

  persist({
    locale,
    currency,
    itemCount: view.itemCount,
    items,
    subtotalFormatted: view.subtotalFormatted,
    shippingFormatted: view.shippingFormatted,
    totalFormatted: view.totalFormatted,
    updatedAt: Date.now(),
  });
}

/** Optimistic add — updates localStorage before the server action resolves. */
export function optimisticAddToCartLocal(
  snapshot: CartProductSnapshot,
  quantity: number,
  locale: Locale,
  currency: Currency,
): CartLocalView {
  const qty = Math.max(1, Math.floor(quantity));
  const current = readCartLocalView();
  const shippingFormatted =
    current?.locale === locale && current.currency === currency
      ? current.shippingFormatted
      : emptyCartShipping(locale, currency);

  const existingItems =
    current?.locale === locale && current.currency === currency
      ? [...current.items]
      : [];

  const index = existingItems.findIndex(
    (item) => item.productId === snapshot.productId,
  );

  if (index >= 0) {
    const existing = existingItems[index]!;
    existingItems[index] = {
      ...existing,
      quantity: existing.quantity + qty,
      title: snapshot.title || existing.title,
      imageUrl: snapshot.imageUrl ?? existing.imageUrl,
      unitAmount: snapshot.unitAmount ?? existing.unitAmount,
      unitPriceFormatted:
        snapshot.unitPriceFormatted || existing.unitPriceFormatted,
    };
  } else {
    existingItems.push({
      id: localCartItemId(snapshot.productId),
      productId: snapshot.productId,
      title: snapshot.title,
      quantity: qty,
      imageUrl: snapshot.imageUrl,
      unitAmount: snapshot.unitAmount ?? null,
      unitPriceFormatted: snapshot.unitPriceFormatted,
      lineTotalFormatted: snapshot.unitPriceFormatted,
    });
  }

  const next = recomputeCartLocalView(
    existingItems,
    locale,
    currency,
    shippingFormatted,
  );
  persist(next);
  return next;
}

/** Optimistic quantity change in localStorage. */
export function optimisticSetQuantityLocal(
  itemId: string,
  quantity: number,
  locale: Locale,
  currency: Currency,
): CartLocalView | null {
  const current = readCartLocalView();
  if (!current || current.locale !== locale || current.currency !== currency) {
    return current;
  }

  const items =
    quantity < 1
      ? current.items.filter((item) => item.id !== itemId)
      : current.items.map((item) =>
          item.id === itemId ? { ...item, quantity } : item,
        );

  const next = recomputeCartLocalView(
    items,
    locale,
    currency,
    current.shippingFormatted,
  );
  persist(next);
  return next;
}

/** Optimistic remove in localStorage. */
export function optimisticRemoveLocal(
  itemId: string,
  locale: Locale,
  currency: Currency,
): CartLocalView | null {
  return optimisticSetQuantityLocal(itemId, 0, locale, currency);
}
