'use client';

import { useAuth } from '../../lib/auth/AuthContext';
import { useWishlistIdsContext } from '../../lib/wishlist/WishlistIdsProvider';
import { useCartBadgeDisplay } from './useCartBadgeDisplay';

/**
 * Cart and wishlist item counts for mobile navigation badges (bottom bar).
 */
export function useMobileNavBadgeCounts(): { cartCount: number; wishlistCount: number } {
  const { isLoggedIn, isLoading: isAuthLoading } = useAuth();
  const { cartCount } = useCartBadgeDisplay();
  const { wishlistCount } = useWishlistIdsContext();

  return { cartCount, wishlistCount: !isAuthLoading && isLoggedIn ? wishlistCount : 0 };
}
