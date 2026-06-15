import type { MenuCategory } from '@/components/home/menu-types';
import { STOREFRONT_ALL_CATEGORY_SLUG } from '@/constants/storefront-all-category-slug';
import type { ShopCategoryEntry } from './shop-page-data.helpers';
import type { ShopMobileCategoryCard } from './shop-page-query.types';

export function mapCategoryEntriesToMenuCategories(
  categoryEntries: ShopCategoryEntry[],
  allProductCount: number,
  slugToProductCount: Map<string, number>,
  includeProductCounts = true
): MenuCategory[] {
  return categoryEntries.map((entry) => ({
    id: entry.id,
    slug: entry.slug,
    title: entry.title,
    iconUrl: entry.iconUrl,
    productCount: includeProductCounts
      ? entry.slug === ''
        ? allProductCount
        : (slugToProductCount.get(entry.slug) ?? 0)
      : undefined,
  }));
}

export function mapCategoryEntriesToMobileCategories(
  categoryEntries: ShopCategoryEntry[],
  allProductCount: number,
  slugToProductCount: Map<string, number>,
  includeProductCounts = true
): ShopMobileCategoryCard[] {
  return categoryEntries.map((entry) => ({
    id: entry.id,
    slug: entry.slug === '' ? STOREFRONT_ALL_CATEGORY_SLUG : entry.slug,
    title: entry.title,
    iconUrl: entry.iconUrl,
    productCount: includeProductCounts
      ? entry.slug === ''
        ? allProductCount
        : (slugToProductCount.get(entry.slug) ?? 0)
      : undefined,
  }));
}
