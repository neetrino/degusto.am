'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../lib/auth/AuthContext';
import { apiClient } from '../../lib/api-client';
import { getWishlistCount } from '../../lib/storageCounts';
import {
  applyCartBadgeFromDetail,
  parseCartUpdatedDetail,
  resetCartBadgeState,
} from '@/lib/cart/cart-events';
import {
  clearCartSummaryCache,
  readCartSummaryCache,
  writeCartSummaryCache,
} from '../../lib/cartSummaryCache';

interface CartResponse {
  cart?: {
    itemsCount?: number;
    totals?: {
      total?: number;
    };
  };
}

type CartUpdatedDetail = {
  itemsCount?: number;
  total?: number;
  forceReload?: boolean;
};

const HOME_PATH = '/';
const SHOP_PATH = '/shop';
const DEFER_CART_FETCH_IDLE_TIMEOUT_MS = 2000;

function shouldDeferInitialCartFetch(pathname: string): boolean {
  return pathname === HOME_PATH || pathname === SHOP_PATH;
}

/** Runs after idle (or timeout fallback); returns cancel for effect cleanup. */
function scheduleIdleCartFetch(run: () => void): () => void {
  let cancelled = false;
  const invoke = () => {
    if (!cancelled) {
      run();
    }
  };

  if (typeof window.requestIdleCallback === 'function') {
    const idleId = window.requestIdleCallback(invoke, { timeout: DEFER_CART_FETCH_IDLE_TIMEOUT_MS });
    return () => {
      cancelled = true;
      window.cancelIdleCallback(idleId);
    };
  }

  const timeoutId = window.setTimeout(invoke, DEFER_CART_FETCH_IDLE_TIMEOUT_MS);
  return () => {
    cancelled = true;
    window.clearTimeout(timeoutId);
  };
}

/**
 * Cart and wishlist item counts for mobile navigation badges (bottom bar).
 */
export function useMobileNavBadgeCounts(): { cartCount: number; wishlistCount: number } {
  const pathname = usePathname() ?? '';
  const deferInitialCartFetch = shouldDeferInitialCartFetch(pathname);
  const { isLoggedIn, isLoading: isAuthLoading } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    const cached = readCartSummaryCache();
    if (cached) {
      setCartCount(cached.itemsCount);
    }

    let cancelDeferredCartFetch: (() => void) | undefined;

    const fetchCart = async () => {
      try {
        const response = await apiClient.get<CartResponse>('/api/v1/cart');
        const itemsCount = response.cart?.itemsCount || 0;
        const total = response.cart?.totals?.total || 0;
        if (itemsCount === 0) {
          resetCartBadgeState();
          return;
        }
        setCartCount(itemsCount);
        writeCartSummaryCache(itemsCount, total);
      } catch {
        resetCartBadgeState();
      }
    };

    const runInitialCartFetch = () => {
      if (deferInitialCartFetch && isLoggedIn) {
        cancelDeferredCartFetch = scheduleIdleCartFetch(() => {
          void fetchCart();
        });
        return;
      }
      void fetchCart();
    };

    const handleCartUpdated = (event: Event) => {
      const detail = parseCartUpdatedDetail(event) as CartUpdatedDetail | undefined;

      if (detail?.forceReload) {
        cancelDeferredCartFetch?.();
        void fetchCart();
        return;
      }

      const badgeResult = applyCartBadgeFromDetail(detail, (itemsCount, total) => {
        setCartCount(itemsCount);
        writeCartSummaryCache(itemsCount, total);
      });
      if (badgeResult === 'handled') {
        return;
      }

      cancelDeferredCartFetch?.();
      void fetchCart();
    };

    const refreshWishlistCount = () => {
      if (!isLoggedIn) {
        setWishlistCount(0);
        return;
      }
      void getWishlistCount().then(setWishlistCount);
    };

    refreshWishlistCount();
    runInitialCartFetch();

    const handleWishlistUpdated = () => {
      refreshWishlistCount();
    };

    const handleAuthForCartAndWishlist = () => {
      clearCartSummaryCache();
      refreshWishlistCount();
      cancelDeferredCartFetch?.();
      void fetchCart();
    };

    window.addEventListener('cart-updated', handleCartUpdated);
    window.addEventListener('auth-updated', handleAuthForCartAndWishlist);
    window.addEventListener('wishlist-updated', handleWishlistUpdated);

    return () => {
      cancelDeferredCartFetch?.();
      window.removeEventListener('cart-updated', handleCartUpdated);
      window.removeEventListener('auth-updated', handleAuthForCartAndWishlist);
      window.removeEventListener('wishlist-updated', handleWishlistUpdated);
    };
  }, [deferInitialCartFetch, isAuthLoading, isLoggedIn]);

  return { cartCount, wishlistCount };
}
