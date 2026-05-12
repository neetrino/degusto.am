'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api-client';
import { logger } from '../../lib/utils/logger';
import {
  emitWishlistUpdated,
  getLocalWishlistIds,
  toggleLocalWishlistId,
  setLocalWishlistIds,
} from '../../lib/wishlist';

/**
 * Hook for managing wishlist state for a product
 * @param productId - The product ID to check/manage
 * @returns Object with wishlist state and toggle function
 */
export function useWishlist(productId: string) {
  const [isInWishlist, setIsInWishlist] = useState(false);

  useEffect(() => {
    const checkWishlist = () => {
      setIsInWishlist(getLocalWishlistIds().includes(productId));
    };

    checkWishlist();

    const handleWishlistUpdate = () => checkWishlist();
    window.addEventListener('wishlist-updated', handleWishlistUpdate);

    return () => {
      window.removeEventListener('wishlist-updated', handleWishlistUpdate);
    };
  }, [productId]);

  const toggleWishlist = async () => {
    const previousIds = getLocalWishlistIds();
    const updatedIds = toggleLocalWishlistId(productId);
    const nextState = updatedIds.includes(productId);
    setIsInWishlist(nextState);
    emitWishlistUpdated();

    try {
      if (nextState) {
        await apiClient.post('/api/v1/users/wishlist', { productId });
      } else {
        await apiClient.delete(`/api/v1/users/wishlist/${productId}`);
      }
    } catch (error) {
      // Revert local optimistic change if server sync failed.
      setLocalWishlistIds(previousIds);
      setIsInWishlist(previousIds.includes(productId));
      emitWishlistUpdated();
      logger.error('Error syncing wishlist item', { error, productId });
    }
  };

  return { isInWishlist, toggleWishlist };
}




