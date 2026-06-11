'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { prefetchStorefrontRoute } from '@/lib/routing/prefetch-storefront-route';

type HomeVisibleRoutesWarmupProps = {
  categoryHrefs: readonly string[];
  productSlugs: readonly string[];
};

const IDLE_WARMUP_DELAY_MS = 120;
const MAX_PREFETCH_CATEGORY_ROUTES = 4;
const MAX_PREFETCH_PRODUCT_ROUTES = 4;

function scheduleIdleWork(work: () => void): void {
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(() => work(), { timeout: 800 });
    return;
  }

  window.setTimeout(work, IDLE_WARMUP_DELAY_MS);
}

/** Prefetches visible home links after first paint so tab/card clicks feel instant. */
export function HomeVisibleRoutesWarmup({
  categoryHrefs,
  productSlugs,
}: HomeVisibleRoutesWarmupProps): null {
  const router = useRouter();

  useEffect(() => {
    scheduleIdleWork(() => {
      for (const href of categoryHrefs.slice(0, MAX_PREFETCH_CATEGORY_ROUTES)) {
        prefetchStorefrontRoute(router, href);
      }
      for (const slug of productSlugs.slice(0, MAX_PREFETCH_PRODUCT_ROUTES)) {
        prefetchStorefrontRoute(router, `/products/${encodeURIComponent(slug)}`);
      }
    });
  }, [categoryHrefs, productSlugs, router]);

  return null;
}
