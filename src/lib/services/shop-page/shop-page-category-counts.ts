import type { StorefrontLocale } from '@/lib/i18n/locale';
import { fetchMenuCategoryProductCounts } from '../menu-page/menu-page-category-counts';
import type { ShopMenuQuery } from './shop-page-query.types';

export type ShopCategoryProductCounts = {
  allProductCount: number;
  countBySlug: Record<string, number>;
};

/**
 * Total matching products and per-category slug counts in two queries (replaces N+1 `product.count`).
 */
export async function fetchShopMenuCategoryProductCounts(
  locale: StorefrontLocale,
  query: ShopMenuQuery,
  slugsToCount: string[]
): Promise<ShopCategoryProductCounts> {
  return fetchMenuCategoryProductCounts(locale, query, 'exclude', slugsToCount);
}
