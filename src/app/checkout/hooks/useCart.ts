import { useState, useEffect, useCallback } from 'react';
import { fetchCartForGuest } from '../checkoutUtils';
import type { Cart } from '../types';
import { parseCartUpdatedDetail } from '@/lib/cart/cart-events';

export function useCart(_isLoggedIn: boolean) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      const cartData = await fetchCartForGuest();
      setCart(cartData);
    } catch {
      setError('Failed to load cart');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    const onCartUpdated = (event: Event) => {
      const detail = parseCartUpdatedDetail(event);
      if (detail?.itemsCount === 0 && detail?.total === 0) {
        setCart(null);
        return;
      }
      void fetchCart();
    };
    window.addEventListener('cart-updated', onCartUpdated);
    return () => window.removeEventListener('cart-updated', onCartUpdated);
  }, [fetchCart]);

  return { cart, loading, error, setError, fetchCart };
}

