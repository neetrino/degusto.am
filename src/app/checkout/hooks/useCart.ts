import { useState, useEffect, useCallback } from 'react';
import type { Cart } from '../types';
import { parseCartUpdatedDetail } from '@/lib/cart/cart-events';
import { useCartDrawer } from '@/components/cart-drawer/cart-drawer-context';

export function useCart(_isLoggedIn: boolean) {
  const { cart: drawerCart, reloadCart: reloadDrawerCart, isCartResolved } = useCartDrawer();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isCartResolved) {
      setLoading(true);
      return;
    }
    setCart(drawerCart);
    setLoading(false);
  }, [drawerCart, isCartResolved]);

  useEffect(() => {
    const onCartUpdated = (event: Event) => {
      const detail = parseCartUpdatedDetail(event);
      if (detail?.itemsCount === 0 && detail?.total === 0) {
        setCart(null);
        return;
      }
      void reloadDrawerCart({ silent: true });
    };
    window.addEventListener('cart-updated', onCartUpdated);
    return () => window.removeEventListener('cart-updated', onCartUpdated);
  }, [reloadDrawerCart]);

  const fetchSyncedCart = useCallback(async () => {
    try {
      setLoading(true);
      await reloadDrawerCart({ silent: true });
    } catch {
      setError('Failed to load cart');
    } finally {
      setLoading(false);
    }
  }, [reloadDrawerCart]);

  return { cart, loading, error, setError, fetchCart: fetchSyncedCart };
}

