'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../lib/auth/AuthContext';
import { getWishlistCount } from '../../lib/storageCounts';
import { useCartBadgeDisplay } from './useCartBadgeDisplay';

/**
 * Cart and wishlist item counts for mobile navigation badges (bottom bar).
 */
export function useMobileNavBadgeCounts(): { cartCount: number; wishlistCount: number } {
  const { isLoggedIn, isLoading: isAuthLoading } = useAuth();
  const { cartCount } = useCartBadgeDisplay();
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    const refreshWishlistCount = () => {
      if (!isLoggedIn) {
        setWishlistCount(0);
        return;
      }
      void getWishlistCount().then(setWishlistCount);
    };

    refreshWishlistCount();

    const handleWishlistUpdated = () => {
      refreshWishlistCount();
    };

    const handleAuthForWishlist = () => {
      refreshWishlistCount();
    };

    window.addEventListener('auth-updated', handleAuthForWishlist);
    window.addEventListener('wishlist-updated', handleWishlistUpdated);

    return () => {
      window.removeEventListener('auth-updated', handleAuthForWishlist);
      window.removeEventListener('wishlist-updated', handleWishlistUpdated);
    };
  }, [isAuthLoading, isLoggedIn]);

  return { cartCount, wishlistCount };
}
