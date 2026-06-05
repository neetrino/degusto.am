'use client';

import { useCallback, useEffect, useRef, useState, type SetStateAction } from 'react';
import type { Cart } from '@/app/cart/types';
import { fetchCart } from '@/app/cart/cart-fetcher';
import { parseCartUpdatedDetail } from '@/lib/cart/cart-events';
import {
  applyOptimisticCartAdd,
  snapshotFromCartDetail,
} from '@/lib/cart/optimistic-cart-add';
import { applyRemovedLinesFilter } from '@/lib/cart/pending-cart-removals';
import { dispatchCartSummarySync } from '@/lib/cart/cart-summary-sync';
import { createEmptyCart } from '@/lib/cart/empty-cart';
import { readCartSummaryCache } from '@/lib/cartSummaryCache';

const CART_RECONCILE_DEBOUNCE_MS = 400;

type UseCartLiveSyncOptions = {
  isLoggedIn: boolean;
  isAuthLoading: boolean;
  t: (key: string) => string;
  /** Open cart drawer when an optimistic add is applied (instant feedback). */
  onOptimisticAdd?: () => void;
};

function resolveInitialCartState(): Cart | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const cached = readCartSummaryCache();
  if (cached && cached.itemsCount > 0) {
    return null;
  }

  return createEmptyCart();
}

function normalizeCartPayload(cartData: Cart | null): Cart {
  return applyRemovedLinesFilter(cartData) ?? createEmptyCart();
}

export function useCartLiveSync({
  isLoggedIn,
  isAuthLoading,
  t,
  onOptimisticAdd,
}: UseCartLiveSyncOptions) {
  const [cart, setCart] = useState<Cart | null>(resolveInitialCartState);
  const [cartLoading, setCartLoading] = useState(false);
  const cartRef = useRef<Cart | null>(null);
  const reconcileTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reloadGenerationRef = useRef(0);
  const cartHydratedRef = useRef(resolveInitialCartState() !== null);

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  const commitCart = useCallback((value: SetStateAction<Cart | null>) => {
    cartHydratedRef.current = true;
    setCart(value);
  }, []);

  useEffect(() => {
    if (!cartHydratedRef.current && cart === null) {
      return;
    }
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
        if (!silent) {
          commitCart(createEmptyCart());
        }
      } finally {
        if (generation === reloadGenerationRef.current) {
          setCartLoading(false);
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

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }
    void reloadCart({ silent: true });
  }, [isAuthLoading, isLoggedIn, reloadCart]);

  useEffect(() => {
    const onCartUpdate = (event: Event) => {
      const detail = parseCartUpdatedDetail(event);
      if (!detail) {
        return;
      }

      if (detail.forceReload) {
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

      const snapshot = snapshotFromCartDetail(detail);
      if (snapshot) {
        commitCart(applyOptimisticCartAdd(cartRef.current, snapshot));
        setCartLoading(false);
        onOptimisticAdd?.();
      }

      if (!detail.skipReconcile && (snapshot || detail.itemsCount !== undefined)) {
        scheduleReconcile();
      }
    };

    window.addEventListener('cart-updated', onCartUpdate);
    return () => {
      window.removeEventListener('cart-updated', onCartUpdate);
      if (reconcileTimerRef.current) {
        clearTimeout(reconcileTimerRef.current);
      }
    };
  }, [
    commitCart,
    invalidateInFlightReload,
    onOptimisticAdd,
    reloadCart,
    scheduleReconcile,
  ]);

  return {
    cart,
    setCart: commitCart,
    cartLoading,
    setCartLoading,
    reloadCart,
    scheduleReconcile,
    cartRef,
  };
}
