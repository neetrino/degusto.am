import type { MouseEvent } from 'react';
import { COMPARE_KEY } from '../types';
import { t } from '../../../../lib/i18n';
import type { LanguageCode } from '../../../../lib/language';
import { useAuth } from '../../../../lib/auth/AuthContext';
import { apiClient } from '../../../../lib/api-client';
import {
  emitWishlistUpdated,
  getLocalWishlistIds,
  setLocalWishlistIds,
} from '../../../../lib/wishlist';

interface UseProductActionsProps {
  productId: string | null;
  isInWishlist: boolean;
  setIsInWishlist: (value: boolean) => void;
  isInCompare: boolean;
  setIsInCompare: (value: boolean) => void;
  setShowMessage: (message: string | null) => void;
  language: LanguageCode;
}

export function useProductActions({
  productId,
  isInWishlist,
  setIsInWishlist,
  isInCompare,
  setIsInCompare,
  setShowMessage,
  language,
}: UseProductActionsProps) {
  const { isLoggedIn } = useAuth();

  const handleAddToWishlist = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!productId || typeof window === 'undefined') return;
    
    try {
      const wishlist = getLocalWishlistIds();
      
      if (isInWishlist) {
        const updated = setLocalWishlistIds(wishlist.filter(id => id !== productId));
        setIsInWishlist(false);
        setShowMessage(t(language, 'product.removedFromWishlist'));
        emitWishlistUpdated();
        if (isLoggedIn) {
          await apiClient.delete(`/api/v1/users/wishlist/${productId}`);
          setLocalWishlistIds(updated);
        }
      } else {
        const updated = setLocalWishlistIds([...wishlist, productId]);
        setIsInWishlist(true);
        setShowMessage(t(language, 'product.addedToWishlist'));
        emitWishlistUpdated();
        if (isLoggedIn) {
          await apiClient.post('/api/v1/users/wishlist', { productId });
          setLocalWishlistIds(updated);
        }
      }
      
      setTimeout(() => setShowMessage(null), 2000);
      emitWishlistUpdated();
    } catch {
      // Silently fail
    }
  };

  const handleCompareToggle = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!productId || typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(COMPARE_KEY);
      const compare: string[] = stored ? JSON.parse(stored) : [];
      
      if (isInCompare) {
        localStorage.setItem(COMPARE_KEY, JSON.stringify(compare.filter(id => id !== productId)));
        setIsInCompare(false);
        setShowMessage(t(language, 'product.removedFromCompare'));
      } else {
        if (compare.length >= 4) {
          setShowMessage(t(language, 'product.compareListFull'));
        } else {
          compare.push(productId);
          localStorage.setItem(COMPARE_KEY, JSON.stringify(compare));
          setIsInCompare(true);
          setShowMessage(t(language, 'product.addedToCompare'));
        }
      }
      
      setTimeout(() => setShowMessage(null), 2000);
      window.dispatchEvent(new Event('compare-updated'));
    } catch {
      // Silently fail
    }
  };

  return {
    handleAddToWishlist,
    handleCompareToggle,
  };
}




