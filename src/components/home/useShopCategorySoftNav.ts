'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { MenuCard } from './menu-types';
import {
  clearShopMenuProductsClientCache,
  fetchShopMenuProducts,
  prefetchShopMenuProducts,
} from '@/lib/shop/fetch-shop-menu-products.client';

type ShopMenuPagination = {
  currentPage: number;
  totalPages: number;
};

type UseShopCategorySoftNavOptions = {
  initialCards: MenuCard[];
  initialActiveCategorySlug: string;
  initialPagination?: ShopMenuPagination;
  /** When true, category clicks update URL + products client-side (desktop sidebar). */
  enabled: boolean;
};

type UseShopCategorySoftNavResult = {
  displayCards: MenuCard[];
  displayActiveCategorySlug: string;
  displayPagination: ShopMenuPagination | undefined;
  isProductsPending: boolean;
  navigateCategory: (href: string, categorySlug: string) => void;
  prefetchCategory: (href: string) => void;
};

export function useShopCategorySoftNav({
  initialCards,
  initialActiveCategorySlug,
  initialPagination,
  enabled,
}: UseShopCategorySoftNavOptions): UseShopCategorySoftNavResult {
  const [displayCards, setDisplayCards] = useState(initialCards);
  const [displayActiveCategorySlug, setDisplayActiveCategorySlug] = useState(initialActiveCategorySlug);
  const [displayPagination, setDisplayPagination] = useState(initialPagination);
  const [isProductsPending, setIsProductsPending] = useState(false);
  const navigationGenerationRef = useRef(0);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    clearShopMenuProductsClientCache();
    setDisplayCards(initialCards);
    setDisplayActiveCategorySlug(initialActiveCategorySlug);
    setDisplayPagination(initialPagination);
  }, [initialActiveCategorySlug, initialCards, initialPagination]);

  const loadProductsForHref = useCallback(
    async (href: string, categorySlug: string, updateHistory = true) => {
      if (!enabledRef.current) {
        return;
      }

      const generation = ++navigationGenerationRef.current;
      setDisplayActiveCategorySlug(categorySlug);
      setIsProductsPending(true);

      try {
        const data = await fetchShopMenuProducts(href);
        if (generation !== navigationGenerationRef.current) {
          return;
        }
        setDisplayCards(data.cards);
        setDisplayPagination({
          currentPage: data.effectivePage,
          totalPages: data.totalPages,
        });
        if (updateHistory) {
          window.history.pushState({ shopSoftNav: true }, '', href);
        }
      } finally {
        if (generation === navigationGenerationRef.current) {
          setIsProductsPending(false);
        }
      }
    },
    []
  );

  const navigateCategory = useCallback(
    (href: string, categorySlug: string) => {
      if (!enabledRef.current) {
        return;
      }
      void loadProductsForHref(href, categorySlug, true);
    },
    [loadProductsForHref]
  );

  const prefetchCategory = useCallback((href: string) => {
    if (!enabledRef.current) {
      return;
    }
    prefetchShopMenuProducts(href);
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handlePopState = () => {
      const href = `${window.location.pathname}${window.location.search}`;
      const params = new URLSearchParams(window.location.search);
      const rawCategory = params.get('category')?.trim() ?? '';
      void loadProductsForHref(href, rawCategory, false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [enabled, loadProductsForHref]);

  return {
    displayCards,
    displayActiveCategorySlug,
    displayPagination,
    isProductsPending,
    navigateCategory,
    prefetchCategory,
  };
}
