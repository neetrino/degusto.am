/** Query slug for “all products” on mobile shop (`/shop?category=all`). Desktop uses no category param. */
export const STOREFRONT_ALL_CATEGORY_SLUG = 'all';
const STOREFRONT_CATEGORY_SLUG_ALIASES: Record<string, string[]> = {
  lahmajo: ['lahmajoun'],
  lahmajoun: ['lahmajo'],
};

/** Maps mobile “all” slug to empty string for product queries (no category filter). */
export function normalizeStorefrontCategorySlug(slug: string): string {
  const trimmed = slug.trim();
  return trimmed === STOREFRONT_ALL_CATEGORY_SLUG ? '' : trimmed;
}

/**
 * Returns accepted slug variants for category filters (legacy/current spelling support).
 */
export function getStorefrontCategorySlugCandidates(slug: string): string[] {
  const normalized = normalizeStorefrontCategorySlug(slug);
  if (!normalized) {
    return [];
  }

  const candidates = new Set<string>([normalized]);
  const aliases = STOREFRONT_CATEGORY_SLUG_ALIASES[normalized] ?? [];
  for (const alias of aliases) {
    if (alias) {
      candidates.add(alias);
    }
  }
  return Array.from(candidates);
}

export function isStorefrontAllCategorySlug(slug: string): boolean {
  const trimmed = slug.trim();
  return trimmed === '' || trimmed === STOREFRONT_ALL_CATEGORY_SLUG;
}
