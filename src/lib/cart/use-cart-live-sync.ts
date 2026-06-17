'use client';

import { useCallback, useEffect, useRef, useState, type SetStateAction } from 'react';
import type { Cart } from '@/app/cart/types';
import { fetchCart } from '@/app/cart/cart-fetcher';
import { parseCartUpdatedDetail } from '@/lib/cart/cart-events';
import {
  applyOptimisticCartAdd,
  confirmOptimisticCartLine,
  snapshotFromCartDetail,
} from '@/lib/cart/optimistic-cart-add';
import { buildCustomizationLineKey, normalizeProductCustomizations } from '@/lib/cart/customizations';
import { applyRemovedLinesFilter } from '@/lib/cart/pending-cart-removals';
import { dispatchCartSummarySync } from '@/lib/cart/cart-summary-sync';
import { createEmptyCart } from '@/lib/cart/empty-cart';

const CART_RECONCILE_DEBOUNCE_MS = 400;
const CART_OPTIMISTIC_RECONCILE_IDLE_MS = 900;
const CART_RECONCILE_MIN_GAP_MS = 1500;
const CART_SNAPSHOT_CACHE_KEY = 'shop_cart_snapshot_cache';
const CART_SNAPSHOT_MAX_AGE_MS = 1000 * 60 * 5;

type UseCartLiveSyncOptions = {
  isLoggedIn: boolean;
  isAuthLoading: boolean;
  t: (key: string) => string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function isCartSnapshotPayload(value: unknown): value is { cart: Cart; updatedAt: number } {
  if (!isRecord(value)) {
    return false;
  }

  const updatedAt = value.updatedAt;
  const cart = value.cart;
  if (typeof updatedAt !== 'number' || !Number.isFinite(updatedAt)) {
    return false;
  }
  if (!isRecord(cart)) {
    return false;
  }

  const items = cart.items;
  const totals = cart.totals;
  return Array.isArray(items) && isRecord(totals) && typeof cart.itemsCount === 'number';
}

function readCartSnapshotCache(): Cart | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(CART_SNAPSHOT_CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isCartSnapshotPayload(parsed)) {
      return null;
    }

    if (Date.now() - parsed.updatedAt > CART_SNAPSHOT_MAX_AGE_MS) {
      return null;
    }

    return normalizeCartPayload(parsed.cart);
  } catch {
    return null;
  }
}

function writeCartSnapshotCache(cart: Cart | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (!cart || cart.itemsCount <= 0 || cart.items.length === 0) {
    window.localStorage.removeItem(CART_SNAPSHOT_CACHE_KEY);
    return;
  }

  window.localStorage.setItem(
    CART_SNAPSHOT_CACHE_KEY,
    JSON.stringify({
      cart,
      updatedAt: Date.now(),
    })
  );
}

function resolveInitialCartState(): Cart | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return readCartSnapshotCache() ?? createEmptyCart();
}

function normalizeCartPayload(cartData: Cart | null): Cart {
  return applyRemovedLinesFilter(cartData) ?? createEmptyCart();
}

function buildPendingOptimisticLineKey(input: {
  variantId: string;
  customizations?: Parameters<typeof normalizeProductCustomizations>[0];
}): string {
  return buildCustomizationLineKey(
    input.variantId,
    normalizeProductCustomizations(input.customizations)
  );
}

export function useCartLiveSync({
  isLoggedIn,
  isAuthLoading,
  t,
}: UseCartLiveSyncOptions) {
  const [cart, setCart] = useState<Cart | null>(resolveInitialCartState);
  const [cartLoading, setCartLoading] = useState(false);
  const [isCartResolved, setIsCartResolved] = useState(false);
  const cartRef = useRef<Cart | null>(null);
  const reconcileTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const optimisticReconcileTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reloadGenerationRef = useRef(0);
  const badgeSyncReadyRef = useRef(false);
  const lastReconcileAtRef = useRef(0);
  const pendingOptimisticLinesRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  const commitCart = useCallback((value: SetStateAction<Cart | null>) => {
    badgeSyncReadyRef.current = true;
    setCart(value);
  }, []);

  useEffect(() => {
    if (!badgeSyncReadyRef.current) {
      return;
    }
    writeCartSnapshotCache(cart);
    dispatchCartSummarySync(cart);
  }, [cart]);

  const invalidateInFlightReload = useCallback(() => {
    reloadGenerationRef.current += 1;
  }, []);

  const reloadCart = useCallback(
    async (options?: { silent?: boolean }) => {
      const generation = ++reloadGenerationRef.current;
      const silent = options?.silent ?? false;
      if (!silent) {
        setCartLoading(true);
      }
      try {
        const cartData = await fetchCart(isLoggedIn, t);
        if (generation !== reloadGenerationRef.current) {
          return;
        }
        commitCart(normalizeCartPayload(cartData));
      } catch {
        if (generation !== reloadGenerationRef.current) {
          return;
        }
        // Preserve the last known cart on transient read failures.
        commitCart((previous) => previous ?? createEmptyCart());
      } finally {
        if (generation === reloadGenerationRef.current) {
          setCartLoading(false);
          setIsCartResolved(true);
          badgeSyncReadyRef.current = true;
        }
      }
    },
    [commitCart, isLoggedIn, t]
  );

  const scheduleReconcile = useCallback(() => {
    if (reconcileTimerRef.current) {
      clearTimeout(reconcileTimerRef.current);
    }
    reconcileTimerRef.current = setTimeout(() => {
      reconcileTimerRef.current = null;
      void reloadCart({ silent: true });
    }, CART_RECONCILE_DEBOUNCE_MS);
  }, [reloadCart]);

  const scheduleOptimisticBurstReconcile = useCallback(() => {
    if (optimisticReconcileTimerRef.current) {
      clearTimeout(optimisticReconcileTimerRef.current);
    }

    optimisticReconcileTimerRef.current = setTimeout(() => {
      optimisticReconcileTimerRef.current = null;
      if (pendingOptimisticLinesRef.current.size > 0) {
        // Wait until optimistic lines are confirmed to avoid "appear -> disappear -> appear".
        scheduleOptimisticBurstReconcile();
        return;
      }
      const now = Date.now();
      const elapsed = now - lastReconcileAtRef.current;
      if (elapsed < CART_RECONCILE_MIN_GAP_MS) {
        optimisticReconcileTimerRef.current = setTimeout(() => {
          optimisticReconcileTimerRef.current = null;
          lastReconcileAtRef.current = Date.now();
          void reloadCart({ silent: true });
        }, CART_RECONCILE_MIN_GAP_MS - elapsed);
        return;
      }

      lastReconcileAtRef.current = now;
      void reloadCart({ silent: true });
    }, CART_OPTIMISTIC_RECONCILE_IDLE_MS);
  }, [reloadCart]);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }
    setIsCartResolved(false);
    void reloadCart({ silent: true });
  }, [isAuthLoading, isLoggedIn, reloadCart]);

  useEffect(() => {
    const onCartUpdate = (event: Event) => {
      const detail = parseCartUpdatedDetail(event);
      if (!detail) {
        return;
      }

      if (detail.forceReload) {
        pendingOptimisticLinesRef.current.clear();
        void reloadCart({ silent: true });
        return;
      }

      if (detail.skipReconcile) {
        invalidateInFlightReload();
        if (reconcileTimerRef.current) {
          clearTimeout(reconcileTimerRef.current);
          reconcileTimerRef.current = null;
        }
      }

      if (detail.confirmedLine) {
        const confirmedKey = buildPendingOptimisticLineKey({
          variantId: detail.confirmedLine.previousVariantId,
          customizations: detail.confirmedLine.customizations,
        });
        const pendingCount = pendingOptimisticLinesRef.current.get(confirmedKey) ?? 0;
        if (pendingCount <= 1) {
          pendingOptimisticLinesRef.current.delete(confirmedKey);
        } else {
          pendingOptimisticLinesRef.current.set(confirmedKey, pendingCount - 1);
        }

        const nextCart = confirmOptimisticCartLine(cartRef.current, detail.confirmedLine);
        commitCart(nextCart);
        setCartLoading(false);
        if (nextCart === cartRef.current) {
          // No optimistic row to promote: fetch persisted cart before exposing new line.
          void reloadCart({ silent: true });
          return;
        }
        scheduleOptimisticBurstReconcile();
      }

      const snapshot = snapshotFromCartDetail(detail);
      if (snapshot) {
        const pendingKey = buildPendingOptimisticLineKey({
          variantId: snapshot.variantId,
          customizations: snapshot.customizations,
        });
        pendingOptimisticLinesRef.current.set(
          pendingKey,
          (pendingOptimisticLinesRef.current.get(pendingKey) ?? 0) + 1
        );
        commitCart(applyOptimisticCartAdd(cartRef.current, snapshot));
        setCartLoading(false);
        scheduleOptimisticBurstReconcile();
      }

      if (!detail.skipReconcile && detail.itemsCount !== undefined) {
        scheduleReconcile();
      }
    };

    window.addEventListener('cart-updated', onCartUpdate);
    return () => {
      window.removeEventListener('cart-updated', onCartUpdate);
      if (reconcileTimerRef.current) {
        clearTimeout(reconcileTimerRef.current);
      }
      if (optimisticReconcileTimerRef.current) {
        clearTimeout(optimisticReconcileTimerRef.current);
      }
    };
  }, [
    commitCart,
    invalidateInFlightReload,
    scheduleOptimisticBurstReconcile,
    reloadCart,
    scheduleReconcile,
  ]);

  return {
    cart,
    setCart: commitCart,
    cartLoading,
    isCartResolved,
    setCartLoading,
    reloadCart,
    scheduleReconcile,
    cartRef,
  };
}
