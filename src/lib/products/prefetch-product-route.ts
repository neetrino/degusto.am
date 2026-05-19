const PREFETCHED_SLUGS_MAX = 80;
const prefetchedSlugs = new Set<string>();

type RouterWithPrefetch = {
  prefetch: (href: string) => void;
};

/**
 * Prefetch PDP RSC payload once per slug per session (hover / focus on product cards).
 */
export function prefetchProductRoute(router: RouterWithPrefetch, slug: string): void {
  const normalized = slug.trim();
  if (!normalized) {
    return;
  }
  if (prefetchedSlugs.has(normalized)) {
    return;
  }
  if (prefetchedSlugs.size >= PREFETCHED_SLUGS_MAX) {
    const first = prefetchedSlugs.values().next().value;
    if (first) {
      prefetchedSlugs.delete(first);
    }
  }
  prefetchedSlugs.add(normalized);
  router.prefetch(`/products/${encodeURIComponent(normalized)}`);
}
