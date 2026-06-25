import type { ProductFoodTasteFlags } from '@/lib/product-food-attributes';

/** Categories without spicy/greens badge toggles (mirrors seed data). */
const NO_FOOD_TASTE_BADGE_CATEGORY_SLUGS = new Set([
  'juices-drinks',
  'bar-alcohol',
  'cakes-pancakes',
  'pastry',
  'bread',
  'sauces',
  'semi-finished',
]);

export type FoodTasteBadgeSelection = ProductFoodTasteFlags;

export function createEmptyFoodTasteBadgeSelection(): FoodTasteBadgeSelection {
  return { supportsSpicy: false, supportsGreens: false };
}

/** Food products (non-clothing) get spicy/greens icon toggles on the product form. */
export function productFormSupportsFoodTasteBadges(
  _categoryIds: string[],
  isClothingCategory: boolean,
): boolean {
  return !isClothingCategory;
}

export function categorySupportsFoodTasteBadges(
  primaryCategoryId: string | null | undefined,
  categories: Array<{ id: string; slug?: string; requiresSizes?: boolean }>,
): boolean {
  if (!primaryCategoryId) {
    return false;
  }
  const category = categories.find((item) => item.id === primaryCategoryId);
  if (!category || category.requiresSizes) {
    return false;
  }
  if (category.slug && NO_FOOD_TASTE_BADGE_CATEGORY_SLUGS.has(category.slug)) {
    return false;
  }
  return true;
}

export function inferFoodTasteBadgeSelectionFromProduct(
  product: {
    supportsSpicy?: boolean | null;
    supportsGreens?: boolean | null;
  } | null | undefined,
): FoodTasteBadgeSelection {
  return {
    supportsSpicy: product?.supportsSpicy === true,
    supportsGreens: product?.supportsGreens === true,
  };
}

/** Resolves taste flags for save: off when category is ineligible. */
export function resolveFoodTasteFlagsForSave(
  selection: FoodTasteBadgeSelection,
  categoryEligible: boolean,
): FoodTasteBadgeSelection {
  if (!categoryEligible) {
    return createEmptyFoodTasteBadgeSelection();
  }
  return {
    supportsSpicy: selection.supportsSpicy,
    supportsGreens: selection.supportsGreens,
  };
}
