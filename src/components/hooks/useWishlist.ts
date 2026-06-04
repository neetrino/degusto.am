'use client';

import { apiClient } from '../../lib/api-client';
import { logger } from '../../lib/utils/logger';
import { useAuth } from '../../lib/auth/AuthContext';
import { emitWishlistUpdated } from '../../lib/wishlist';
import { useWishlistIdsContext } from '../../lib/wishlist/WishlistIdsProvider';

/**
 * Hook for managing wishlist state for a product (persisted in database).
 * Reads shared ids from WishlistIdsProvider — one API fetch per page, not per card.
 */
export function useWishlist(productId: string) {
  const { isLoggedIn } = useAuth();
  const { isInWishlist, setProductInWishlist } = useWishlistIdsContext();

  const toggleWishlist = async () => {
    if (!isLoggedIn) {
      return;
    }

    const previousState = isInWishlist(productId);
    const nextState = !previousState;
    setProductInWishlist(productId, nextState);

    try {
      if (nextState) {
        await apiClient.post('/api/v1/users/wishlist', { productId });
      } else {
        await apiClient.delete(`/api/v1/users/wishlist/${productId}`);
      }
      emitWishlistUpdated();
    } catch (error) {
      setProductInWishlist(productId, previousState);
      emitWishlistUpdated();
      logger.error('Error syncing wishlist item', { error, productId });
    }
  };

  return { isInWishlist: isInWishlist(productId), toggleWishlist };
}
