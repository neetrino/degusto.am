import type { StorefrontLocale } from '@/lib/i18n/locale';
import { fetchMenuCategoryProductCounts } from '../menu-page/menu-page-category-counts';
import type { ComboMenuQuery } from './combo-page-query.types';

export type ComboCategoryProductCounts = {
  allProductCount: number;
  countBySlug: Record<string, number>;
};

/**
 * Total matching combo products and per-category slug counts in two queries (replaces N+1 `product.count`).
 */
export async function fetchComboMenuCategoryProductCounts(
  locale: StorefrontLocale,
  query: ComboMenuQuery,
  slugsToCount: string[]
): Promise<ComboCategoryProductCounts> {
  return fetchMenuCategoryProductCounts(locale, query, 'only', slugsToCount);
}
