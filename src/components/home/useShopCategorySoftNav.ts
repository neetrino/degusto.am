'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { MenuCard } from './menu-types';
import {
  clearShopMenuProductsClientCache,
  fetchShopMenuProducts,
} from '@/lib/shop/fetch-shop-menu-products.client';
import { prefetchStorefrontRoute } from '@/lib/routing/prefetch-storefront-route';
import { logger } from '@/lib/utils/logger';

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
  const router = useRouter();
  const [displayCards, setDisplayCards] = useState(initialCards);
  const [displayActiveCategorySlug, setDisplayActiveCategorySlug] = useState(initialActiveCategorySlug);
  const [displayPagination, setDisplayPagination] = useState(initialPagination);
  const [isProductsPending, setIsProductsPending] = useState(false);
  const hydratedFromServerRef = useRef(false);
  const navigationGenerationRef = useRef(0);
  const enabledRef = useRef(enabled);
  const activeHrefRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    if (!hydratedFromServerRef.current) {
      hydratedFromServerRef.current = true;
    } else {
      clearShopMenuProductsClientCache();
    }
    setDisplayCards(initialCards);
    setDisplayActiveCategorySlug(initialActiveCategorySlug);
    setDisplayPagination(initialPagination);
  }, [initialActiveCategorySlug, initialCards, initialPagination]);

  useEffect(() => {
    activeHrefRef.current = `${window.location.pathname}${window.location.search}`;
  }, []);

  const loadProductsForHref = useCallback(
    async (href: string, categorySlug: string, updateHistory = true) => {
      if (!enabledRef.current) {
        return;
      }
      if (href === activeHrefRef.current) {
        return;
      }

      const generation = ++navigationGenerationRef.current;
      abortControllerRef.current?.abort();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      setDisplayActiveCategorySlug(categorySlug);
      setIsProductsPending(true);

      try {
        const data = await fetchShopMenuProducts(href, { signal: abortController.signal });
        if (generation !== navigationGenerationRef.current) {
          return;
        }
        setDisplayCards(data.cards);
        setDisplayPagination({
          currentPage: data.effectivePage,
          totalPages: data.totalPages,
        });
        activeHrefRef.current = href;
        if (updateHistory) {
          window.history.pushState({ shopSoftNav: true }, '', href);
        }
      } catch (error: unknown) {
        const isAbortError =
          error instanceof DOMException
            ? error.name === 'AbortError'
            : error instanceof Error && error.name === 'AbortError';
        if (!isAbortError) {
          logger.warn('[Shop] Soft category navigation failed', {
            href,
            categorySlug,
            error: error instanceof Error ? error.message : String(error),
          });
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
    prefetchStorefrontRoute(router, href, { prefetchRsc: false });
  }, [router]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handlePopState = () => {
      const href = `${window.location.pathname}${window.location.search}`;
      activeHrefRef.current = href;
      const params = new URLSearchParams(window.location.search);
      const rawCategory = params.get('category')?.trim() ?? '';
      void loadProductsForHref(href, rawCategory, false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
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
