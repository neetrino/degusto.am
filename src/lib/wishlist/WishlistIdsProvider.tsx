'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '../auth/AuthContext';
import { fetchWishlistIds, invalidateWishlistIdsCache } from '../wishlist-api';

type WishlistIdsContextValue = {
  isInWishlist: (productId: string) => boolean;
  setProductInWishlist: (productId: string, inWishlist: boolean) => void;
  wishlistCount: number;
  wishlistProductIds: string[];
};

const WishlistIdsContext = createContext<WishlistIdsContextValue | null>(null);

/**
 * Loads wishlist product ids once per session and shares them across product cards.
 */
export function WishlistIdsProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(() => new Set());
  const fetchGenerationRef = useRef(0);

  const refreshWishlistIds = useCallback(async () => {
    if (!isLoggedIn) {
      setWishlistIds(new Set());
      return;
    }

    const generation = ++fetchGenerationRef.current;
    const ids = await fetchWishlistIds();
    if (generation !== fetchGenerationRef.current) {
      return;
    }
    setWishlistIds(new Set(ids));
  }, [isLoggedIn]);

  useEffect(() => {
    void refreshWishlistIds();

    const handleWishlistUpdated = () => {
      invalidateWishlistIdsCache();
      void refreshWishlistIds();
    };
    const handleAuthUpdated = () => {
      void refreshWishlistIds();
    };

    window.addEventListener('wishlist-updated', handleWishlistUpdated);
    window.addEventListener('auth-updated', handleAuthUpdated);

    return () => {
      window.removeEventListener('wishlist-updated', handleWishlistUpdated);
      window.removeEventListener('auth-updated', handleAuthUpdated);
    };
  }, [refreshWishlistIds]);

  const setProductInWishlist = useCallback((productId: string, inWishlist: boolean) => {
    setWishlistIds((previous) => {
      const next = new Set(previous);
      if (inWishlist) {
        next.add(productId);
      } else {
        next.delete(productId);
      }
      return next;
    });
  }, []);

  const value = useMemo<WishlistIdsContextValue>(
    () => ({
      isInWishlist: (productId: string) => wishlistIds.has(productId),
      setProductInWishlist,
      wishlistCount: wishlistIds.size,
      wishlistProductIds: Array.from(wishlistIds),
    }),
    [setProductInWishlist, wishlistIds]
  );

  return <WishlistIdsContext.Provider value={value}>{children}</WishlistIdsContext.Provider>;
}

export function useWishlistIdsContext(): WishlistIdsContextValue {
  const context = useContext(WishlistIdsContext);
  if (!context) {
    throw new Error('useWishlistIdsContext must be used within WishlistIdsProvider');
  }
  return context;
}
