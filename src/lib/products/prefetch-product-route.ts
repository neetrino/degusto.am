import { getStoredLanguage } from '@/lib/language';
import { buildProductPageHref } from '@/lib/products/build-product-page-href';

const PREFETCHED_SLUGS_MAX = 80;
const PREFETCH_BUNDLE_COOLDOWN_MS = 30_000;
const MAX_INFLIGHT_PDP_BUNDLE_PREFETCHES = 1;
const prefetchedSlugs = new Set<string>();
const bundlePrefetchedSlugs = new Set<string>();
const bundlePrefetchedAt = new Map<string, number>();
const inflightBundlePrefetches = new Set<string>();

type RouterWithPrefetch = {
  prefetch: (href: string) => void;
};

export type PrefetchProductRouteOptions = {
  /** Warm `/api/v1/products/.../pdp` JSON + Redis. Default false for passive hover/viewport prefetch. */
  warmPdpBundle?: boolean;
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
  const now = Date.now();
  const previousPrefetchAt = bundlePrefetchedAt.get(normalized);
  const isCoolingDown =
    typeof previousPrefetchAt === 'number' &&
    now - previousPrefetchAt < PREFETCH_BUNDLE_COOLDOWN_MS;

  if (
    !normalized ||
    bundlePrefetchedSlugs.has(normalized) ||
    inflightBundlePrefetches.has(normalized) ||
    isCoolingDown
  ) {
    return;
  }

  if (inflightBundlePrefetches.size >= MAX_INFLIGHT_PDP_BUNDLE_PREFETCHES) {
    return;
  }

  if (bundlePrefetchedSlugs.size >= PREFETCHED_SLUGS_MAX) {
    const first = bundlePrefetchedSlugs.values().next().value;
    if (first) {
      bundlePrefetchedSlugs.delete(first);
      bundlePrefetchedAt.delete(first);
    }
  }

  inflightBundlePrefetches.add(normalized);
  bundlePrefetchedAt.set(normalized, now);
  bundlePrefetchedSlugs.add(normalized);
  const locale = lang ?? getStoredLanguage();
  const encoded = encodeURIComponent(normalized);

  void fetch(`/api/v1/products/${encoded}/pdp?lang=${locale}&mode=warm`, {
    method: 'GET',
    credentials: 'same-origin',
    priority: 'low',
  })
    .catch(() => undefined)
    .finally(() => {
      inflightBundlePrefetches.delete(normalized);
    });
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
  lang?: string,
  options?: PrefetchProductRouteOptions
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

  if (options?.warmPdpBundle) {
    prefetchProductPdpBundle(normalized, lang);
  }
}

type RouterWithPush = RouterWithPrefetch & {
  push: (href: string) => void;
};

/** Keyboard/submit paths: warm caches then client-navigate via Next.js router. */
export function navigateToProductPage(router: RouterWithPush, slug: string): void {
  prefetchProductRoute(router, slug, undefined, { warmPdpBundle: true });
  router.push(buildProductPageHref(slug));
}
