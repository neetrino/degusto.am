import { getStoredLanguage } from '@/lib/language';
import { buildProductPageHref } from '@/lib/products/build-product-page-href';

const PREFETCHED_SLUGS_MAX = 80;
const prefetchedSlugs = new Set<string>();
const bundlePrefetchedSlugs = new Set<string>();

type RouterWithPrefetch = {
  prefetch: (href: string) => void;
};

function trimSlug(slug: string): string {
  return slug.trim();
}

/**
 * Warm full PDP bundle (Redis + Data Cache) without blocking UI.
 */
export function prefetchProductPdpBundle(slug: string, lang?: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  const normalized = trimSlug(slug);
  if (!normalized || bundlePrefetchedSlugs.has(normalized)) {
    return;
  }

  if (bundlePrefetchedSlugs.size >= PREFETCHED_SLUGS_MAX) {
    const first = bundlePrefetchedSlugs.values().next().value;
    if (first) {
      bundlePrefetchedSlugs.delete(first);
    }
  }

  bundlePrefetchedSlugs.add(normalized);
  const locale = lang ?? getStoredLanguage();
  const encoded = encodeURIComponent(normalized);

  void fetch(`/api/v1/products/${encoded}/pdp?lang=${locale}`, {
    method: 'GET',
    credentials: 'same-origin',
    priority: 'low',
  }).catch(() => undefined);
}

/** @deprecated Use prefetchProductPdpBundle — kept for call sites that only need visual JSON. */
export function prefetchProductVisual(slug: string, lang?: string): void {
  prefetchProductPdpBundle(slug, lang);
}

/**
 * Prefetch PDP RSC payload + bundle API once per slug per session.
 */
export function prefetchProductRoute(
  router: RouterWithPrefetch,
  slug: string,
  lang?: string
): void {
  const normalized = trimSlug(slug);
  if (!normalized) {
    return;
  }

  if (!prefetchedSlugs.has(normalized)) {
    if (prefetchedSlugs.size >= PREFETCHED_SLUGS_MAX) {
      const first = prefetchedSlugs.values().next().value;
      if (first) {
        prefetchedSlugs.delete(first);
      }
    }
    prefetchedSlugs.add(normalized);
    router.prefetch(buildProductPageHref(normalized));
  }

  prefetchProductPdpBundle(normalized, lang);
}

type RouterWithPush = RouterWithPrefetch & {
  push: (href: string) => void;
};

/** Keyboard/submit paths: warm caches then client-navigate via Next.js router. */
export function navigateToProductPage(router: RouterWithPush, slug: string): void {
  prefetchProductRoute(router, slug);
  router.push(buildProductPageHref(slug));
}
