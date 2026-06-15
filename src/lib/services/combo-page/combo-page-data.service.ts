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
import { logger } from '@/lib/utils/logger';
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

async function fetchComboProductsPage(
  locale: StorefrontLocale,
  query: ComboMenuQuery,
  productWhere: ReturnType<typeof buildComboProductWhere>
): Promise<Pick<ComboMenuDbResult, 'productTotal' | 'productRows'>> {
  const countStartedAt = Date.now();
  const productTotalPromise = db.product
    .count({ where: productWhere })
    .then((value) => ({ value, durationMs: Date.now() - countStartedAt }));
  const rowsStartedAt = Date.now();
  const productRowsPromise = db.product
    .findMany({
      where: productWhere,
      orderBy: {
        updatedAt: 'desc',
      },
      skip: (query.requestedPage - 1) * STORE_MENU_PAGE_SIZE,
      take: STORE_MENU_PAGE_SIZE,
      select: getComboProductSelect(locale),
    })
    .then((value) => ({ value, durationMs: Date.now() - rowsStartedAt }));
  const [productTotalResult, productRowsResult] = await Promise.all([
    productTotalPromise,
    productRowsPromise,
  ]);
  const productTotal = productTotalResult.value;
  const productRows = productRowsResult.value as unknown as ShopMenuProductRow[];

  logger.info('[COMBO PERF] db product page query timings', {
    locale,
    page: query.requestedPage,
    dbCountMs: productTotalResult.durationMs,
    dbRowsMs: productRowsResult.durationMs,
    productTotal,
    rowCount: productRows.length,
  });

  const totalPages = productTotal === 0 ? 0 : Math.ceil(productTotal / STORE_MENU_PAGE_SIZE);
  const effectivePage = totalPages === 0 ? 1 : Math.min(query.requestedPage, totalPages);

  if (effectivePage === query.requestedPage) {
    return {
      productTotal,
      productRows,
    };
  }

  const clampStartedAt = Date.now();
  const clampedRows = (await db.product.findMany({
    where: productWhere,
    orderBy: {
      updatedAt: 'desc',
    },
    skip: (effectivePage - 1) * STORE_MENU_PAGE_SIZE,
    take: STORE_MENU_PAGE_SIZE,
    select: getComboProductSelect(locale),
  })) as unknown as ShopMenuProductRow[];
  logger.info('[COMBO PERF] db clamped product page query timing', {
    locale,
    requestedPage: query.requestedPage,
    effectivePage,
    dbClampRowsMs: Date.now() - clampStartedAt,
    rowCount: clampedRows.length,
  });

  return {
    productTotal,
    productRows: clampedRows,
  };
}

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
        const productWhere = buildComboProductWhere(locale, query, productWhereBase);
        const categoryStartedAt = Date.now();
        const categoryPayloadPromise = db.category
          .findMany({
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
          })
          .then(async (nextCategoryRows) => {
            const nextCategoryEntries = buildShopCategoryEntries(
              locale,
              allCategoriesLabel,
              nextCategoryRows
            );
            const nextSlugsToCount = nextCategoryEntries
              .filter((item) => item.slug !== '')
              .map((item) => item.slug);

            let nextAllProductCount = 0;
            let nextCountBySlug: Record<string, number> = {};
            try {
              const counts = await fetchComboMenuCategoryProductCounts(
                locale,
                query,
                nextSlugsToCount
              );
              nextAllProductCount = counts.allProductCount;
              nextCountBySlug = counts.countBySlug;
            } catch (countsError) {
              logger.error('[COMBO] Category product counts failed', countsError);
            }

            return {
              categoryRows: nextCategoryRows,
              allProductCount: nextAllProductCount,
              countBySlug: nextCountBySlug,
            };
          });
        const productsPayloadPromise = fetchComboProductsPage(locale, query, productWhere);

        const [categoryPayload, productsPayload] = await Promise.all([
          categoryPayloadPromise,
          productsPayloadPromise,
        ]);
        logger.info('[COMBO PERF] category + counts query complete', {
          locale,
          durationMs: Date.now() - categoryStartedAt,
          categoryCount: categoryPayload.categoryRows.length,
          allProductCount: categoryPayload.allProductCount,
        });

        return {
          productTotal: productsPayload.productTotal,
          productRows: productsPayload.productRows,
          categoryRows: categoryPayload.categoryRows,
          allProductCount: categoryPayload.allProductCount,
          countBySlug: categoryPayload.countBySlug,
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
  ['combo-menu-data-v2'],
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
