/**
 * Shared category tree types and helpers (used by API services and UI).
 */

export interface CategoryTreeNode {
  id: string;
  slug: string;
  title: string;
  fullPath: string;
  children: CategoryTreeNode[];
}

/**
 * Depth-first flatten (matches legacy CategoryNavigation ordering).
 */
export function flattenCategoryTree(cats: CategoryTreeNode[]): CategoryTreeNode[] {
  const result: CategoryTreeNode[] = [];
  for (const cat of cats) {
    result.push(cat);
    if (cat.children?.length) {
      result.push(...flattenCategoryTree(cat.children));
    }
  }
  return result;
}
