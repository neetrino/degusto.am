import { unstable_cache } from 'next/cache';
import { STORE_MENU_PAGE_SIZE } from '@/constants/store-menu-page-size';
import { withPrismaResilience } from '@/lib/db/with-prisma-resilience';
import type { StorefrontLocale } from '@/lib/i18n/locale';
import { db } from '@white-shop/db';
import {
  buildShopCategoryEntries,
  mapShopProductRowsToMenuCards,
  type ShopMenuProductRow,
} from './shop-page-data.helpers';
import {
  mapCategoryEntriesToMenuCategories,
  mapCategoryEntriesToMobileCategories,
} from './shop-page-mappers';
import { fetchShopMenuCategoryProductCounts } from './shop-page-category-counts';
import {
  buildShopProductWhere,
  buildShopProductWhereBase,
  getShopProductSelect,
} from './shop-page-product-where';
import type { ShopMenuData, ShopMenuDbResult, ShopMenuQuery } from './shop-page-query.types';

export type {
  ShopMenuData,
  ShopMenuQuery,
  ShopMobileCategoryCard,
} from './shop-page-query.types';

/** Shared cache tag for `revalidateTag` on product/category admin writes. */
export const SHOP_MENU_CACHE_TAG = 'shop-menu';

export const SHOP_MENU_REVALIDATE_SECONDS = 60;

/**
 * Loads shop menu categories, product counts, and paginated product cards from the database.
 */
export async function loadShopMenuData(query: ShopMenuQuery): Promise<ShopMenuData> {
  const { locale } = query;
  const allCategoriesLabel = locale === 'hy' ? 'Բոլորը' : 'All';
  const productWhereBase = buildShopProductWhereBase(locale, query);

  const { productTotal, productRows, categoryRows, allProductCount, countBySlug } =
    await withPrismaResilience<ShopMenuDbResult>(
      async () => {
        const nextCategoryRows = await db.category.findMany({
          where: {
            published: true,
            deletedAt: null,
            translations: {
              none: {
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
          await fetchShopMenuCategoryProductCounts(locale, query, nextSlugsToCount);

        if (query.mobileCategoryGridOnly) {
          return {
            productTotal: 0,
            productRows: [],
            categoryRows: nextCategoryRows,
            allProductCount: nextAllProductCount,
            countBySlug: nextCountBySlug,
          };
        }

        const productWhere = buildShopProductWhere(locale, query, productWhereBase);
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
          select: getShopProductSelect(locale),
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
      'SHOP',
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
    mobileShopCategories: mapCategoryEntriesToMobileCategories(
      categoryEntries,
      allProductCount,
      slugToProductCount
    ),
    effectivePage,
    totalPages,
  };
}

const getShopMenuDataCached = unstable_cache(
  async (
    locale: StorefrontLocale,
    selectedCategorySlug: string,
    selectedSearchQuery: string,
    tasteFilter: '' | 'leaf' | 'pepper',
    minPriceAmdKey: string,
    maxPriceAmdKey: string,
    requestedPageKey: string,
    mobileCategoryGridOnlyKey: '0' | '1'
  ) => {
    const parsedPage = parseInt(requestedPageKey, 10);
    const minPriceAmd =
      minPriceAmdKey === '' ? null : Number(minPriceAmdKey);
    const maxPriceAmd =
      maxPriceAmdKey === '' ? null : Number(maxPriceAmdKey);

    return loadShopMenuData({
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
      requestedPage:
        Number.isFinite(parsedPage) && parsedPage >= 1 ? parsedPage : 1,
      mobileCategoryGridOnly: mobileCategoryGridOnlyKey === '1',
    });
  },
  ['shop-menu-data-v4'],
  {
    revalidate: SHOP_MENU_REVALIDATE_SECONDS,
    tags: [SHOP_MENU_CACHE_TAG],
  }
);

/**
 * Shop menu payload with per-query Data Cache (60s TTL, invalidated via `SHOP_MENU_CACHE_TAG`).
 */
export function getShopMenuData(query: ShopMenuQuery): Promise<ShopMenuData> {
  return getShopMenuDataCached(
    query.locale,
    query.selectedCategorySlug,
    query.selectedSearchQuery,
    query.tasteFilter ?? '',
    query.minPriceAmd === null ? '' : String(query.minPriceAmd),
    query.maxPriceAmd === null ? '' : String(query.maxPriceAmd),
    String(query.requestedPage),
    query.mobileCategoryGridOnly ? '1' : '0'
  );
}
