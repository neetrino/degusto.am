"use client";

import { useSyncExternalStore } from "react";

import {
  getCartPendingMutations,
  readCartLocalView,
  subscribeCartLocalCache,
  type CartLocalView,
} from "@/features/cart/client/cart-local-cache";
import type { Currency } from "@/lib/money/currency";
import type { Locale } from "@/lib/i18n/config";

function getServerSnapshot(): CartLocalView | null {
  return null;
}

/** Reactive optimistic cart snapshot from localStorage (null until client mount). */
export function useCartLocalView(
  locale: Locale,
  currency: Currency,
): CartLocalView | null {
  const view = useSyncExternalStore(
    subscribeCartLocalCache,
    readCartLocalView,
    getServerSnapshot,
  );

  if (!view || view.locale !== locale || view.currency !== currency) {
    return null;
  }
  return view;
}

/** True while a durable cart mutation is in flight. */
export function useCartPendingMutations(): number {
  return useSyncExternalStore(
    subscribeCartLocalCache,
    getCartPendingMutations,
    () => 0,
  );
}
