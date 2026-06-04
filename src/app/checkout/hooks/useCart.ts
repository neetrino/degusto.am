import { useState, useEffect, useCallback } from 'react';
import { fetchCartForGuest } from '../checkoutUtils';
import type { Cart } from '../types';

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

  return { cart, loading, error, setError, fetchCart };
}

