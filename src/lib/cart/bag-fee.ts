export const BAG_FEE_PER_CATEGORY_AMD = 50;

export interface BagFeeCategoryCandidate {
  categoryId?: string | null;
  category?: {
    id?: string | null;
    slug?: string | null;
    name?: string | null;
    title?: string | null;
  } | null;
}

function normalizeCategoryKey(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function resolveBagCategoryKey(candidate: BagFeeCategoryCandidate | null | undefined): string | null {
  if (!candidate) {
    return null;
  }
  return (
    normalizeCategoryKey(candidate.categoryId) ||
    normalizeCategoryKey(candidate.category?.id) ||
    normalizeCategoryKey(candidate.category?.slug) ||
    normalizeCategoryKey(candidate.category?.name) ||
    normalizeCategoryKey(candidate.category?.title)
  );
}

export function calculateBagAmountByUniqueCategories<T>(
  items: readonly T[],
  getCategoryCandidate: (item: T) => BagFeeCategoryCandidate | null | undefined
): number {
  const uniqueCategories = new Set<string>();

  for (const item of items) {
    const categoryKey = resolveBagCategoryKey(getCategoryCandidate(item));
    if (categoryKey) {
      uniqueCategories.add(categoryKey);
    }
  }

  return uniqueCategories.size * BAG_FEE_PER_CATEGORY_AMD;
}
