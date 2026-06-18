import { prefetchProductPdpBundle } from '@/lib/products/prefetch-product-route';
import { prefetchShopMenuProducts } from '@/lib/shop/fetch-shop-menu-products.client';

type RouterWithPrefetch = {
  prefetch: (href: string) => void;
};

type PrefetchStorefrontRouteOptions = {
  prefetchRsc?: boolean;
  prefetchMenuProducts?: boolean;
  prefetchProductBundle?: boolean;
};

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
 */
export function prefetchStorefrontRoute(
  router: RouterWithPrefetch,
  href: string,
  options?: PrefetchStorefrontRouteOptions
): void {
  const normalized = href.trim();
  if (!normalized) {
    return;
  }
  const prefetchRsc = options?.prefetchRsc ?? true;
  const prefetchMenuProducts = options?.prefetchMenuProducts ?? true;
  const prefetchProductBundle = options?.prefetchProductBundle ?? true;

  if (prefetchRsc) {
    void router.prefetch(normalized);
  }

  if (isShopOrComboHref(normalized)) {
    if (prefetchMenuProducts) {
      prefetchShopMenuProducts(hasSearchParams(normalized) ? normalized : '/shop');
    }
    return;
  }

  const productSlug = extractProductSlug(normalized);
  if (productSlug && prefetchProductBundle) {
    prefetchProductPdpBundle(productSlug);
  }
}
