const LEGACY_PRODUCT_ID_PATTERN = /^\d{1,10}$/;

/** Parses the old MySQL numeric product id from `/product/:id`. */
export function parseLegacyProductId(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim() ?? "";
  if (!LEGACY_PRODUCT_ID_PATTERN.test(trimmed)) {
    return null;
  }
  return trimmed;
}

/** Catalog fallback for an unresolved legacy product URL. Never `/`. */
export function legacyProductCatalogPath(locale: string): string {
  return `/${locale}/products`;
}

/** PDP path for a resolved English/ASCII slug. */
export function legacyProductDetailPath(locale: string, slug: string): string {
  return `/${locale}/products/${slug}`;
}
