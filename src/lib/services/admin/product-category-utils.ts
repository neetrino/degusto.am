/**
 * Merge primary category with additional category IDs (primary first, unique).
 */
export function resolveProductCategoryIds(
  categoryIds: string[] | undefined,
  primaryCategoryId: string | null | undefined
): string[] {
  const merged: string[] = [];
  const seen = new Set<string>();

  const add = (id: string | null | undefined): void => {
    if (!id || seen.has(id)) {
      return;
    }
    seen.add(id);
    merged.push(id);
  };

  add(primaryCategoryId);
  for (const id of categoryIds ?? []) {
    add(id);
  }

  return merged;
}

/**
 * Prisma relation payload for product.categories on create.
 */
export function buildProductCategoriesConnect(
  categoryIds: string[] | undefined,
  primaryCategoryId: string | null | undefined
): { connect: Array<{ id: string }> } | undefined {
  const resolved = resolveProductCategoryIds(categoryIds, primaryCategoryId);
  if (resolved.length === 0) {
    return undefined;
  }
  return { connect: resolved.map((id) => ({ id })) };
}

/**
 * Prisma relation payload for product.categories on update (full replace).
 */
export function buildProductCategoriesSet(
  categoryIds: string[] | undefined,
  primaryCategoryId: string | null | undefined
): { set: Array<{ id: string }> } {
  const resolved = resolveProductCategoryIds(categoryIds, primaryCategoryId);
  return { set: resolved.map((id) => ({ id })) };
}
