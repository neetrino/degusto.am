/** Query slug for “all products” on mobile shop (`/shop?category=all`). Desktop uses no category param. */
export const STOREFRONT_ALL_CATEGORY_SLUG = 'all';

/** Maps mobile “all” slug to empty string for product queries (no category filter). */
export function normalizeStorefrontCategorySlug(slug: string): string {
  const trimmed = slug.trim();
  return trimmed === STOREFRONT_ALL_CATEGORY_SLUG ? '' : trimmed;
}

export function isStorefrontAllCategorySlug(slug: string): boolean {
  const trimmed = slug.trim();
  return trimmed === '' || trimmed === STOREFRONT_ALL_CATEGORY_SLUG;
}
