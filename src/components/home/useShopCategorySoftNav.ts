'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { MenuCard } from './menu-types';
import {
  fetchShopMenuProducts,
  seedShopMenuProductsCache,
} from '@/lib/shop/fetch-shop-menu-products.client';
import {
  deriveShopMenuTastePreviewFromCache,
  hrefHasTasteFilter,
} from '@/lib/shop/derive-shop-menu-taste-preview-from-cache';
import {
  hrefToMenuProductsApiUrl,
  peekShopMenuProductsCache,
  clearShopMenuProductsClientCache,
} from '@/lib/shop/shop-menu-products-cache';
import { prefetchStorefrontRoute } from '@/lib/routing/prefetch-storefront-route';
import { logger } from '@/lib/utils/logger';
import { seedRelatedProductsPool } from '@/lib/products/related-products-cache';

function isAbortError(error: unknown): boolean {
  return (
    error instanceof DOMException
      ? error.name === 'AbortError'
      : error instanceof Error && error.name === 'AbortError'
  );
}

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

type HistoryUpdateMode = 'push' | 'replace' | 'none';

type UseShopCategorySoftNavResult = {
  displayCards: MenuCard[];
  displayActiveCategorySlug: string;
  displayPagination: ShopMenuPagination | undefined;
  isProductsPending: boolean;
  /** Instantly filters visible cards for hot/veggie before the network round trip. */
  previewTasteFilterForHref: (href: string) => void;
  navigateCategory: (href: string, categorySlug: string) => void;
  /** Updates URL via replaceState and loads products without RSC navigation (filters, pagination). */
  syncProductsFromHref: (href: string) => void;
  prefetchCategory: (href: string) => void;
};

/** Reads category slug from a shop/combo menu href or search string. */
export function hrefToCategorySlug(href: string): string {
  const questionIndex = href.indexOf('?');
  const search = questionIndex >= 0 ? href.slice(questionIndex + 1) : href.startsWith('?') ? href.slice(1) : '';
  return new URLSearchParams(search).get('category')?.trim() ?? '';
}

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
  const displayCardsRef = useRef(initialCards);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    displayCardsRef.current = displayCards;
  }, [displayCards]);

  useEffect(() => {
    seedRelatedProductsPool(
      displayCards.map((card) => {
        const compareAtPrice =
          card.oldPrice > card.price ? card.oldPrice : null;
        return {
          id: card.id,
          slug: card.slug,
          title: card.title || card.slug,
          price: card.price,
          originalPrice: compareAtPrice,
          compareAtPrice,
          discountPercent: card.discountPercent ?? null,
          defaultVariantId: card.defaultVariantId ?? null,
          image: card.image ?? null,
          inStock: card.inStock ?? true,
          rating: card.rating ?? 5,
          categories:
            card.categorySlug || card.category
              ? [
                  {
                    id: card.categorySlug || card.category || 'uncategorized',
                    slug: card.categorySlug || '',
                    title: card.category || '',
                  },
                ]
              : [],
        };
      })
    );
  }, [displayCards]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const href = `${window.location.pathname}${window.location.search}`;
    seedShopMenuProductsCache(href, {
      cards: initialCards,
      effectivePage: initialPagination?.currentPage ?? 1,
      totalPages: initialPagination?.totalPages ?? 0,
    });
    setDisplayCards(initialCards);
    setDisplayActiveCategorySlug(initialActiveCategorySlug);
    setDisplayPagination(initialPagination);
    if (!hydratedFromServerRef.current) {
      hydratedFromServerRef.current = true;
    }
  }, [initialActiveCategorySlug, initialCards, initialPagination]);

  useEffect(() => {
    activeHrefRef.current = `${window.location.pathname}${window.location.search}`;
  }, []);

  const applyProductPage = useCallback(
    (
      data: Awaited<ReturnType<typeof fetchShopMenuProducts>>,
      href: string,
      categorySlug: string
    ) => {
      setDisplayCards(data.cards);
      setDisplayPagination({
        currentPage: data.effectivePage,
        totalPages: data.totalPages,
      });
      setDisplayActiveCategorySlug(categorySlug);
      activeHrefRef.current = href;
    },
    []
  );

  const previewTasteFilterForHref = useCallback((href: string) => {
    if (!hrefHasTasteFilter(href)) {
      return;
    }
    const preview = deriveShopMenuTastePreviewFromCache(href, displayCardsRef.current);
    if (preview.length === 0) {
      return;
    }
    setDisplayCards(preview);
    setDisplayPagination({ currentPage: 1, totalPages: 0 });
    setIsProductsPending(false);
  }, []);

  const loadProductsForHref = useCallback(
    async (href: string, categorySlug: string, historyUpdate: HistoryUpdateMode = 'push') => {
      if (!enabledRef.current) {
        return;
      }
      if (href === activeHrefRef.current) {
        return;
      }
      if (historyUpdate === 'push') {
        window.history.pushState({ shopSoftNav: true }, '', href);
      } else if (historyUpdate === 'replace') {
        window.history.replaceState({ shopSoftNav: true }, '', href);
      }

      const generation = ++navigationGenerationRef.current;
      abortControllerRef.current?.abort();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const apiUrl = hrefToMenuProductsApiUrl(href);
      const cached = peekShopMenuProductsCache(apiUrl);

      if (cached?.fresh) {
        applyProductPage(cached.data, href, categorySlug);
        return;
      }

      let hasVisibleCards = false;

      if (cached) {
        applyProductPage(cached.data, href, categorySlug);
        hasVisibleCards = cached.data.cards.length > 0;
      } else if (hrefHasTasteFilter(href)) {
        const tastePreview = deriveShopMenuTastePreviewFromCache(href, displayCardsRef.current);
        if (tastePreview.length > 0) {
          applyProductPage(
            { cards: tastePreview, effectivePage: 1, totalPages: 0 },
            href,
            categorySlug
          );
          hasVisibleCards = true;
        } else {
          setDisplayActiveCategorySlug(categorySlug);
        }
      } else {
        setDisplayActiveCategorySlug(categorySlug);
      }

      setIsProductsPending(!hasVisibleCards);

      try {
        const data = await fetchShopMenuProducts(href, {
          signal: abortController.signal,
          forceNetwork: true,
        });
        if (generation !== navigationGenerationRef.current) {
          return;
        }
        applyProductPage(data, href, categorySlug);
      } catch (error: unknown) {
        if (!isAbortError(error)) {
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
    [applyProductPage]
  );

  const reloadProductsForCurrentHref = useCallback(async () => {
    if (!enabledRef.current || typeof window === 'undefined') {
      return;
    }

    clearShopMenuProductsClientCache();

    const href = `${window.location.pathname}${window.location.search}`;
    const categorySlug = hrefToCategorySlug(href);
    const generation = ++navigationGenerationRef.current;
    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const data = await fetchShopMenuProducts(href, {
        signal: abortController.signal,
        forceNetwork: true,
      });
      if (generation !== navigationGenerationRef.current) {
        return;
      }
      applyProductPage(data, href, categorySlug);
    } catch (error: unknown) {
      if (!isAbortError(error)) {
        logger.warn('[Shop] Language-change menu products reload failed', {
          href,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    } finally {
      if (generation === navigationGenerationRef.current) {
        setIsProductsPending(false);
      }
    }
  }, [applyProductPage]);

  const navigateCategory = useCallback(
    (href: string, categorySlug: string) => {
      if (!enabledRef.current) {
        return;
      }
      void loadProductsForHref(href, categorySlug, 'push');
    },
    [loadProductsForHref]
  );

  const syncProductsFromHref = useCallback(
    (href: string) => {
      if (!enabledRef.current) {
        return;
      }
      void loadProductsForHref(href, hrefToCategorySlug(href), 'replace');
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

    const handleLanguageUpdate = () => {
      void reloadProductsForCurrentHref();
    };

    window.addEventListener('language-updated', handleLanguageUpdate);

    const handlePopState = () => {
      const href = `${window.location.pathname}${window.location.search}`;
      const rawCategory = hrefToCategorySlug(href);
      void loadProductsForHref(href, rawCategory, 'none');
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      window.removeEventListener('language-updated', handleLanguageUpdate);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [enabled, loadProductsForHref, reloadProductsForCurrentHref]);

  return {
    displayCards,
    displayActiveCategorySlug,
    displayPagination,
    isProductsPending,
    previewTasteFilterForHref,
    navigateCategory,
    syncProductsFromHref,
    prefetchCategory,
  };
}
