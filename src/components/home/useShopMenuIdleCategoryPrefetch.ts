'use client';

import { useEffect } from 'react';
import { prefetchShopMenuProducts } from '@/lib/shop/fetch-shop-menu-products.client';
import { SHOP_MENU_IDLE_PREFETCH_NEIGHBOR_COUNT } from '@/constants/shop-menu-perf';

type UseShopMenuIdleCategoryPrefetchOptions = {
  categoryHrefs: string[];
  activeCategorySlug: string;
  enabled: boolean;
};

function resolveActiveCategoryIndex(
  categoryHrefs: string[],
  activeCategorySlug: string
): number {
  if (categoryHrefs.length === 0) {
    return -1;
  }
  const normalizedActive = activeCategorySlug.trim();
  const index = categoryHrefs.findIndex((href) => {
    const params = new URLSearchParams(href.includes('?') ? href.split('?')[1] : '');
    return (params.get('category') ?? '').trim() === normalizedActive;
  });
  return index >= 0 ? index : 0;
}

/** Prefetches adjacent category product grids during idle time. */
export function useShopMenuIdleCategoryPrefetch({
  categoryHrefs,
  activeCategorySlug,
  enabled,
}: UseShopMenuIdleCategoryPrefetchOptions): void {
  useEffect(() => {
    if (!enabled || categoryHrefs.length === 0) {
      return;
    }

    const activeIndex = resolveActiveCategoryIndex(categoryHrefs, activeCategorySlug);
    const neighborHrefs: string[] = [];
    for (let offset = 1; offset <= SHOP_MENU_IDLE_PREFETCH_NEIGHBOR_COUNT; offset += 1) {
      const nextHref = categoryHrefs[activeIndex + offset];
      const prevHref = categoryHrefs[activeIndex - offset];
      if (nextHref) {
        neighborHrefs.push(nextHref);
      }
      if (prevHref) {
        neighborHrefs.push(prevHref);
      }
    }

    if (neighborHrefs.length === 0) {
      return;
    }

    const prefetchNeighbors = () => {
      for (const href of neighborHrefs) {
        prefetchShopMenuProducts(href);
      }
    };

    if (typeof window.requestIdleCallback === 'function') {
      const idleId = window.requestIdleCallback(prefetchNeighbors, { timeout: 2000 });
      return () => {
        window.cancelIdleCallback?.(idleId);
      };
    }

    const timerId = window.setTimeout(prefetchNeighbors, 400);
    return () => {
      window.clearTimeout(timerId);
    };
  }, [activeCategorySlug, categoryHrefs, enabled]);
}
