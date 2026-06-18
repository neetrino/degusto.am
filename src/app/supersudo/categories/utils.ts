import type { Category, CategoryWithLevel } from './types';

/**
 * Build a flat category list with ordering metadata.
 */
export function buildCategoryTree(categories: Category[]): CategoryWithLevel[] {
  return [...categories]
    .sort((left, right) => (left.position ?? 0) - (right.position ?? 0))
    .map((category) => ({ ...category, level: 0 }));
}




