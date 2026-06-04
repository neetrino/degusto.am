/**
 * Utility functions for product management
 */

export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-|]/g, '') // Allow pipe character (|) in slug
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/** SKU from slug (e.g. margherita-pizza → MARGHERITA-PIZZA). */
export const generateSkuFromSlug = (slug: string, index = 1): string => {
  const base = (slug || 'prod')
    .toUpperCase()
    .replace(/[^A-Z0-9-|]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  const normalized = base || 'PROD';
  return index > 1 ? `${normalized}-${index}` : normalized;
};

/** Slug from title; supports non-Latin scripts via fallback id. */
export function slugifyProductTitle(title: string): string {
  const fromLatin = generateSlug(title);
  if (fromLatin) {
    return fromLatin;
  }
  const trimmed = title.trim();
  if (!trimmed) {
    return '';
  }
  return `item-${Date.now().toString(36)}`;
}

export function resolveProductSlug(title: string, slug: string): string {
  const fromSlug = slug.trim();
  if (fromSlug) {
    return fromSlug;
  }
  const fromTitle = slugifyProductTitle(title);
  return fromTitle || 'product';
}

/**
 * Generate all combinations of selected attribute values
 */
export const generateAttributeCombinations = (attributeValueGroups: string[][]): string[][] => {
  if (attributeValueGroups.length === 0) {
    return [[]];
  }
  if (attributeValueGroups.length === 1) {
    return attributeValueGroups[0].map((value) => [value]);
  }
  const [firstGroup, ...restGroups] = attributeValueGroups;
  const restCombinations = generateAttributeCombinations(restGroups);
  const result: string[][] = [];
  for (const value of firstGroup) {
    for (const combination of restCombinations) {
      result.push([value, ...combination]);
    }
  }
  return result;
};

/**
 * Check if a category requires sizes
 */
export const isClothingCategory = (primaryCategoryId: string, categories: Array<{ id: string; requiresSizes?: boolean }>): boolean => {
  if (!primaryCategoryId) {
    return false;
  }
  
  const selectedCategory = categories.find((cat) => cat.id === primaryCategoryId);
  if (!selectedCategory) {
    return false;
  }
  
  return selectedCategory.requiresSizes === true;
};


