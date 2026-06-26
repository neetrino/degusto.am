import { prefetchProductPdpBundle } from '@/lib/products/prefetch-product-route';
import { prefetchShopMenuProducts } from '@/lib/shop/fetch-shop-menu-products.client';

type RouterWithPrefetch = {
  prefetch: (href: string) => void;
};

type PrefetchStorefrontRouteOptions = {
  prefetchMenuProducts?: boolean;
  prefetchProductBundle?: boolean;
};

const prefetchedStorefrontHrefs = new Set<string>();

function isShopOrComboHref(href: string): boolean {
  return href.startsWith('/shop') || href.startsWith('/combo');
}

function hasSearchParams(href: string): boolean {
  return href.includes('?');
}

function extractProductSlug(href: string): string | null {
  const match = /^\/products\/([^/?#]+)/u.exec(href);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

/**
 * Warms Next.js RSC payload plus shop menu / PDP JSON caches for a storefront href.
 * Dedupes by href per tab session to avoid fan-out from multiple prefetch helpers.
 */
export function prefetchStorefrontRoute(
  router: RouterWithPrefetch,
  href: string,
  options?: PrefetchStorefrontRouteOptions
): void {
  const normalized = href.trim();
  if (!normalized || prefetchedStorefrontHrefs.has(normalized)) {
    return;
  }
  prefetchedStorefrontHrefs.add(normalized);

  const prefetchMenuProducts = options?.prefetchMenuProducts ?? true;
  const prefetchProductBundle = options?.prefetchProductBundle ?? true;

  void router.prefetch(normalized);

  if (isShopOrComboHref(normalized)) {
    if (prefetchMenuProducts && hasSearchParams(normalized)) {
      prefetchShopMenuProducts(normalized);
    }
    return;
  }

  const productSlug = extractProductSlug(normalized);
  if (productSlug && prefetchProductBundle) {
    prefetchProductPdpBundle(productSlug);
  }
}
