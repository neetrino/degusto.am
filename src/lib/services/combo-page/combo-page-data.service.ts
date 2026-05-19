import { unstable_cache } from 'next/cache';
import { STORE_MENU_PAGE_SIZE } from '@/constants/store-menu-page-size';
import { withPrismaResilience } from '@/lib/db/with-prisma-resilience';
import type { StorefrontLocale } from '@/lib/i18n/locale';
import { db } from '@white-shop/db';
import {
  buildShopCategoryEntries,
  mapShopProductRowsToMenuCards,
  type ShopMenuProductRow,
} from '../shop-page/shop-page-data.helpers';
import { mapCategoryEntriesToMenuCategories } from '../shop-page/shop-page-mappers';
import { fetchComboMenuCategoryProductCounts } from './combo-page-category-counts';
import {
  buildComboProductWhere,
  buildComboProductWhereBase,
  getComboProductSelect,
} from './combo-page-product-where';
import type { ComboMenuData, ComboMenuDbResult, ComboMenuQuery } from './combo-page-query.types';

export type { ComboMenuData, ComboMenuQuery } from './combo-page-query.types';

/** Shared cache tag for `revalidateTag` on product/category admin writes. */
export const COMBO_MENU_CACHE_TAG = 'combo-menu';

export const COMBO_MENU_REVALIDATE_SECONDS = 60;

/**
 * Loads combo menu categories, product counts, and paginated product cards from the database.
 */
export async function loadComboMenuData(query: ComboMenuQuery): Promise<ComboMenuData> {
  const { locale } = query;
  const allCategoriesLabel = locale === 'hy' ? 'Բոլորը' : 'All';
  const productWhereBase = buildComboProductWhereBase(locale, query);

  const { productTotal, productRows, categoryRows, allProductCount, countBySlug } =
    await withPrismaResilience<ComboMenuDbResult>(
      async () => {
        const nextCategoryRows = await db.category.findMany({
          where: {
            published: true,
            deletedAt: null,
            translations: {
              some: {
                locale: 'en',
                slug: 'combo',
              },
            },
          },
          orderBy: {
            position: 'asc',
          },
          select: {
            id: true,
            media: true,
            translations: {
              where: {
                locale: {
                  in: [locale, 'en'],
                },
              },
              select: {
                locale: true,
                title: true,
                slug: true,
              },
            },
          },
        });

        const nextCategoryEntries = buildShopCategoryEntries(
          locale,
          allCategoriesLabel,
          nextCategoryRows
        );
        const nextSlugsToCount = nextCategoryEntries
          .filter((item) => item.slug !== '')
          .map((item) => item.slug);

        const { allProductCount: nextAllProductCount, countBySlug: nextCountBySlug } =
          await fetchComboMenuCategoryProductCounts(locale, query, nextSlugsToCount);

        const productWhere = buildComboProductWhere(locale, query, productWhereBase);
        const nextProductTotal = await db.product.count({ where: productWhere });
        const nextTotalPages =
          nextProductTotal === 0 ? 0 : Math.ceil(nextProductTotal / STORE_MENU_PAGE_SIZE);
        const nextEffectivePage =
          nextTotalPages === 0 ? 1 : Math.min(query.requestedPage, nextTotalPages);

        const nextProductRows = (await db.product.findMany({
          where: productWhere,
          orderBy: {
            updatedAt: 'desc',
          },
          skip: (nextEffectivePage - 1) * STORE_MENU_PAGE_SIZE,
          take: STORE_MENU_PAGE_SIZE,
          select: getComboProductSelect(locale),
        })) as unknown as ShopMenuProductRow[];

        return {
          productTotal: nextProductTotal,
          productRows: nextProductRows,
          categoryRows: nextCategoryRows,
          allProductCount: nextAllProductCount,
          countBySlug: nextCountBySlug,
        };
      },
      {
        productTotal: 0,
        productRows: [],
        categoryRows: [],
        allProductCount: 0,
        countBySlug: {},
      },
      'COMBO',
      'menu data'
    );

  const totalPages =
    productTotal === 0 ? 0 : Math.ceil(productTotal / STORE_MENU_PAGE_SIZE);
  const effectivePage = totalPages === 0 ? 1 : Math.min(query.requestedPage, totalPages);

  const categoryEntries = buildShopCategoryEntries(locale, allCategoriesLabel, categoryRows);
  const slugToProductCount = new Map<string, number>(Object.entries(countBySlug));

  return {
    cards: mapShopProductRowsToMenuCards(locale, productRows),
    categories: mapCategoryEntriesToMenuCategories(
      categoryEntries,
      allProductCount,
      slugToProductCount
    ),
    effectivePage,
    totalPages,
  };
}

const getComboMenuDataCached = unstable_cache(
  async (
    locale: StorefrontLocale,
    selectedCategorySlug: string,
    selectedSearchQuery: string,
    tasteFilter: '' | 'leaf' | 'pepper',
    minPriceAmdKey: string,
    maxPriceAmdKey: string,
    requestedPageKey: string
  ) => {
    const parsedPage = parseInt(requestedPageKey, 10);
    const minPriceAmd = minPriceAmdKey === '' ? null : Number(minPriceAmdKey);
    const maxPriceAmd = maxPriceAmdKey === '' ? null : Number(maxPriceAmdKey);

    return loadComboMenuData({
      locale,
      selectedCategorySlug,
      selectedSearchQuery,
      tasteFilter: tasteFilter === 'leaf' || tasteFilter === 'pepper' ? tasteFilter : null,
      minPriceAmd:
        minPriceAmd !== null && Number.isFinite(minPriceAmd) && minPriceAmd >= 0
          ? minPriceAmd
          : null,
      maxPriceAmd:
        maxPriceAmd !== null && Number.isFinite(maxPriceAmd) && maxPriceAmd >= 0
          ? maxPriceAmd
          : null,
      requestedPage: Number.isFinite(parsedPage) && parsedPage >= 1 ? parsedPage : 1,
    });
  },
  ['combo-menu-data-v1'],
  {
    revalidate: COMBO_MENU_REVALIDATE_SECONDS,
    tags: [COMBO_MENU_CACHE_TAG],
  }
);

/**
 * Combo menu payload with per-query Data Cache (60s TTL, invalidated via `COMBO_MENU_CACHE_TAG`).
 */
export function getComboMenuData(query: ComboMenuQuery): Promise<ComboMenuData> {
  return getComboMenuDataCached(
    query.locale,
    query.selectedCategorySlug,
    query.selectedSearchQuery,
    query.tasteFilter ?? '',
    query.minPriceAmd === null ? '' : String(query.minPriceAmd),
    query.maxPriceAmd === null ? '' : String(query.maxPriceAmd),
    String(query.requestedPage)
  );
}
