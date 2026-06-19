'use client';

import { apiClient } from '../../lib/api-client';
import { logger } from '../../lib/utils/logger';
import { useAuth } from '../../lib/auth/AuthContext';
import {
  getWishlistProductsForIds,
  removeWishlistProductSnapshot,
  upsertWishlistProductSnapshot,
  type WishlistProductSnapshot,
} from '../../lib/wishlist/wishlist-products-cache';
import { useWishlistIdsContext } from '../../lib/wishlist/WishlistIdsProvider';

/**
 * Hook for managing wishlist state for a product (persisted in database).
 * Updates UI optimistically on click; syncs to the server in the background.
 */
export function useWishlist(productId: string) {
  const { isLoggedIn } = useAuth();
  const { isInWishlist, setProductInWishlist } = useWishlistIdsContext();

  const toggleWishlist = (snapshot?: WishlistProductSnapshot) => {
    if (!isLoggedIn) {
      return;
    }

    const previousState = isInWishlist(productId);
    const nextState = !previousState;
    const previousSnapshot = previousState
      ? getWishlistProductsForIds([productId])[0]
      : undefined;

    if (nextState) {
      if (snapshot) {
        upsertWishlistProductSnapshot(snapshot);
      }
    } else {
      removeWishlistProductSnapshot(productId);
    }

    setProductInWishlist(productId, nextState);

    void (async () => {
      try {
        if (nextState) {
          await apiClient.post('/api/v1/users/wishlist', { productId });
          return;
        }
        await apiClient.delete(`/api/v1/users/wishlist/${productId}`);
      } catch (error) {
        setProductInWishlist(productId, previousState);
        if (nextState) {
          removeWishlistProductSnapshot(productId);
        } else if (previousSnapshot) {
          upsertWishlistProductSnapshot(previousSnapshot);
        }
        logger.error('Error syncing wishlist item', { error, productId });
      }
    })();
  };

  return { isInWishlist: isInWishlist(productId), toggleWishlist };
}
