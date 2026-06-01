/** Canonical storefront PDP path for a product slug. */
export function buildProductPageHref(slug: string): string {
  const normalized = slug.trim();
  return `/products/${encodeURIComponent(normalized)}`;
}

/** Extract slug from a `/products/:slug` href (with or without encoding). */
export function parseProductSlugFromHref(href: string): string {
  const path = href.split('?')[0]?.split('#')[0] ?? href;
  const segments = path.split('/').filter(Boolean);
  const productsIndex = segments.indexOf('products');
  if (productsIndex < 0) {
    return '';
  }
  const raw = segments[productsIndex + 1];
  if (!raw) {
    return '';
  }
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
