'use client';

import { apiClient } from '../../lib/api-client';
import { logger } from '../../lib/utils/logger';
import { useAuth } from '../../lib/auth/AuthContext';
import { emitWishlistUpdated } from '../../lib/wishlist';
import { invalidateWishlistIdsCache } from '../../lib/wishlist-api';
import {
  readCachedWishlistProducts,
  removeWishlistProductFromCache,
  upsertWishlistProductSnapshot,
} from '../../lib/wishlist/wishlist-products-cache';
import type { WishlistProductSnapshot } from '../../lib/wishlist/wishlist-product-snapshot';
import { useWishlistIdsContext } from '../../lib/wishlist/WishlistIdsProvider';

/**
 * Hook for managing wishlist state for a product (persisted in database).
 * Reads shared ids from WishlistIdsProvider — one API fetch per page, not per card.
 */
export function useWishlist(productId: string) {
  const { isLoggedIn } = useAuth();
  const { isInWishlist, setProductInWishlist } = useWishlistIdsContext();

  const toggleWishlist = async (snapshot?: WishlistProductSnapshot) => {
    if (!isLoggedIn) {
      return;
    }

    const previousState = isInWishlist(productId);
    const nextState = !previousState;
    const removedSnapshot = !nextState
      ? readCachedWishlistProducts().find((product) => product.id === productId)
      : undefined;

    setProductInWishlist(productId, nextState);

    if (nextState && snapshot) {
      upsertWishlistProductSnapshot(snapshot);
    } else if (!nextState) {
      removeWishlistProductFromCache(productId);
    }

    try {
      if (nextState) {
        await apiClient.post('/api/v1/users/wishlist', { productId });
      } else {
        await apiClient.delete(`/api/v1/users/wishlist/${productId}`);
      }
      invalidateWishlistIdsCache();
      emitWishlistUpdated();
    } catch (error) {
      setProductInWishlist(productId, previousState);
      if (nextState && snapshot) {
        removeWishlistProductFromCache(productId);
      } else if (!nextState && removedSnapshot) {
        upsertWishlistProductSnapshot(removedSnapshot);
      }
      invalidateWishlistIdsCache();
      emitWishlistUpdated();
      logger.error('Error syncing wishlist item', { error, productId });
    }
  };

  return { isInWishlist: isInWishlist(productId), toggleWishlist };
}
