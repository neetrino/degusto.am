import { prefetchProductPdpBundle } from '@/lib/products/prefetch-product-route';
import { prefetchShopMenuProducts } from '@/lib/shop/fetch-shop-menu-products.client';

type RouterWithPrefetch = {
  prefetch: (href: string) => void;
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
export function prefetchStorefrontRoute(router: RouterWithPrefetch, href: string): void {
  const normalized = href.trim();
  if (!normalized) {
    return;
  }

  void router.prefetch(normalized);

  if (isShopOrComboHref(normalized)) {
    if (hasSearchParams(normalized)) {
      prefetchShopMenuProducts(normalized);
    }
    return;
  }

  const productSlug = extractProductSlug(normalized);
  if (productSlug) {
    prefetchProductPdpBundle(productSlug);
  }
}
