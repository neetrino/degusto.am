'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { prefetchStorefrontRoute } from '@/lib/routing/prefetch-storefront-route';
import {
  scheduleIdlePrefetch,
  shouldRunBackgroundRoutePrefetch,
} from '@/lib/routing/prefetch-budget';

type HomeVisibleRoutesWarmupProps = {
  categoryHrefs: readonly string[];
  productSlugs: readonly string[];
};

const MAX_PREFETCH_CATEGORY_ROUTES = 1;
const MAX_PREFETCH_PRODUCT_ROUTES = 0;

/** Prefetches visible home links after first paint so tab/card clicks feel instant. */
export function HomeVisibleRoutesWarmup({
  categoryHrefs,
  productSlugs,
}: HomeVisibleRoutesWarmupProps): null {
  const router = useRouter();

  useEffect(() => {
    if (!shouldRunBackgroundRoutePrefetch()) {
      return;
    }

    scheduleIdlePrefetch(
      () => {
        for (const href of categoryHrefs.slice(0, MAX_PREFETCH_CATEGORY_ROUTES)) {
          prefetchStorefrontRoute(router, href, {
            prefetchMenuProducts: false,
          });
        }
        for (const slug of productSlugs.slice(0, MAX_PREFETCH_PRODUCT_ROUTES)) {
          prefetchStorefrontRoute(router, `/products/${encodeURIComponent(slug)}`, {
            prefetchProductBundle: false,
          });
        }
      },
      { timeout: 800, fallbackDelayMs: 120 }
    );
  }, [categoryHrefs, productSlugs, router]);

  return null;
}
