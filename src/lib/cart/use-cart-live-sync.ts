'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Cart } from '@/app/cart/types';
import { fetchCart } from '@/app/cart/cart-fetcher';
import { parseCartUpdatedDetail } from '@/lib/cart/cart-events';
import {
  applyOptimisticCartAdd,
  snapshotFromCartDetail,
} from '@/lib/cart/optimistic-cart-add';

const CART_RECONCILE_DEBOUNCE_MS = 400;

type UseCartLiveSyncOptions = {
  isLoggedIn: boolean;
  t: (key: string) => string;
};

export function useCartLiveSync({ isLoggedIn, t }: UseCartLiveSyncOptions) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartLoading, setCartLoading] = useState(false);
  const cartRef = useRef<Cart | null>(null);
  const reconcileTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  cartRef.current = cart;

  const reloadCart = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      if (!silent) {
        setCartLoading(true);
      }
      try {
        const cartData = await fetchCart(isLoggedIn, t);
        setCart(cartData);
      } catch {
        if (!silent) {
          setCart(null);
        }
      } finally {
        setCartLoading(false);
      }
    },
    [isLoggedIn, t]
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
    const onCartUpdate = (event: Event) => {
      const detail = parseCartUpdatedDetail(event);

      if (detail?.forceReload) {
        void reloadCart({ silent: cartRef.current !== null });
        return;
      }

      const snapshot = snapshotFromCartDetail(detail);
      if (snapshot) {
        setCart((previous) => applyOptimisticCartAdd(previous, snapshot));
        setCartLoading(false);
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
  }, [reloadCart, scheduleReconcile]);

  return {
    cart,
    setCart,
    cartLoading,
    setCartLoading,
    reloadCart,
    scheduleReconcile,
    cartRef,
  };
}
