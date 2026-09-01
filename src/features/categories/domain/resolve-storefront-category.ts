import { isComboSlug } from "@/features/products/ui/shop/combo-slug";

export type StorefrontCategoryMatch = {
  id: string;
  slug: string;
  title: string;
  aliases: readonly string[];
};

/** Resolves a catalog `?category=` value to a storefront category. */
export function resolveStorefrontCategory<T extends StorefrontCategoryMatch>(
  categories: readonly T[],
  requested: string,
): T | null {
  const normalized = requested.trim();
  if (!normalized || normalized === "all") {
    return null;
  }

  const exact = categories.find(
    (category) =>
      category.slug === normalized || category.aliases.includes(normalized),
  );
  if (exact) {
    return exact;
  }

  if (!isComboSlug(normalized)) {
    return null;
  }

  return (
    categories.find(
      (category) =>
        isComboSlug(category.slug) ||
        isComboSlug(category.title) ||
        category.aliases.some((alias) => isComboSlug(alias)),
    ) ?? null
  );
}

/** True when the request should 308 to the English/ASCII category slug. */
export function shouldCanonicalizeCategoryParam(
  requested: string,
  canonicalSlug: string,
): boolean {
  const normalized = requested.trim();
  if (!normalized || normalized === "all" || isComboSlug(normalized)) {
    return false;
  }
  return normalized !== canonicalSlug;
}
