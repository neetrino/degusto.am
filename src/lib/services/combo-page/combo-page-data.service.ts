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
import type {
  ComboMenuData,
  ComboMenuDbResult,
  ComboMenuProductsPage,
  ComboMenuQuery,
  ComboMenuSidebarPayload,
} from './combo-page-query.types';

export type {
  ComboMenuData,
  ComboMenuLoadProfile,
  ComboMenuQuery,
} from './combo-page-query.types';

export type ComboMenuProductsMetrics = {
  totalServiceMs: number;
};

type ComboMenuFilterKey = Pick<
  ComboMenuQuery,
  'locale' | 'selectedSearchQuery' | 'tasteFilter' | 'minPriceAmd' | 'maxPriceAmd'
>;

type ComboCategoryRow = ComboMenuDbResult['categoryRows'][number];

/** Shared cache tag for `revalidateTag` on product/category admin writes. */
export const COMBO_MENU_CACHE_TAG = 'combo-menu';

export const COMBO_MENU_REVALIDATE_SECONDS = 60;

const EMPTY_COMBO_MENU_PRODUCTS_PAGE: ComboMenuProductsPage = {
  cards: [],
  effectivePage: 1,
  totalPages: 0,
};

const EMPTY_COMBO_MENU_SIDEBAR_PAYLOAD: ComboMenuSidebarPayload = {
  categories: [],
  showCategoryPicker: false,
};

const EMPTY_COMBO_MENU_DATA: ComboMenuData = {
  cards: [],
  categories: [],
  showCategoryPicker: false,
  effectivePage: 1,
  totalPages: 0,
};

async function fetchComboProductsPage(
  locale: StorefrontLocale,
  query: Pick<
    ComboMenuQuery,
    | 'selectedCategorySlug'
    | 'selectedSearchQuery'
    | 'tasteFilter'
    | 'minPriceAmd'
    | 'maxPriceAmd'
    | 'requestedPage'
  >,
  productWhereBase: ReturnType<typeof buildComboProductWhereBase>
): Promise<Pick<ComboMenuDbResult, 'productTotal' | 'productRows'>> {
  const productWhere = buildComboProductWhere(
    locale,
    query as ComboMenuQuery,
    productWhereBase
  );
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

function mapComboProductsPage(
  locale: StorefrontLocale,
  productTotal: number,
  productRows: ShopMenuProductRow[],
  requestedPage: number
): ComboMenuProductsPage {
  const totalPages =
    productTotal === 0 ? 0 : Math.ceil(productTotal / STORE_MENU_PAGE_SIZE);
  const effectivePage = totalPages === 0 ? 1 : Math.min(requestedPage, totalPages);

  return {
    cards: mapShopProductRowsToMenuCards(locale, productRows),
    effectivePage,
    totalPages,
  };
}

async function fetchComboCategoryRows(locale: StorefrontLocale): Promise<ComboCategoryRow[]> {
  return db.category.findMany({
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
}

async function loadComboMenuSidebar(filter: ComboMenuFilterKey): Promise<ComboMenuSidebarPayload> {
  const startedAt = Date.now();
  const allCategoriesLabel = filter.locale === 'hy' ? 'Բոլորը' : 'All';
  const filterQuery: ComboMenuQuery = {
    ...filter,
    selectedCategorySlug: '',
    requestedPage: 1,
    loadProfile: 'full',
  };

  const categoryRows = await withPrismaResilience(
    () => fetchComboCategoryRows(filter.locale),
    [] as ComboCategoryRow[],
    'COMBO',
    'sidebar categories'
  );
  const categoryEntries = buildShopCategoryEntries(
    filter.locale,
    allCategoriesLabel,
    categoryRows
  );
  const shouldSkipCountsForFastFirstOpen =
    !filter.selectedSearchQuery &&
    !filter.tasteFilter &&
    filter.minPriceAmd === null &&
    filter.maxPriceAmd === null;

  let allProductCount = 0;
  let countBySlug: Record<string, number> = {};
  if (!shouldSkipCountsForFastFirstOpen) {
    const slugsToCount = categoryEntries
      .filter((item) => item.slug !== '')
      .map((item) => item.slug);
    try {
      const counts = await fetchComboMenuCategoryProductCounts(
        filter.locale,
        filterQuery,
        slugsToCount
      );
      allProductCount = counts.allProductCount;
      countBySlug = counts.countBySlug;
    } catch (countsError) {
      logger.error('[COMBO] Category product counts failed', countsError);
    }
  }

  const slugToProductCount = new Map<string, number>(Object.entries(countBySlug));
  logger.info('[COMBO PERF] sidebar query complete', {
    locale: filter.locale,
    categoryCount: categoryEntries.length,
    allProductCount,
    durationMs: Date.now() - startedAt,
  });

  return {
    categories: mapCategoryEntriesToMenuCategories(
      categoryEntries,
      allProductCount,
      slugToProductCount,
      !shouldSkipCountsForFastFirstOpen
    ),
    showCategoryPicker: categoryEntries.length > 0,
  };
}

async function loadComboMenuProducts(
  query: Pick<
    ComboMenuQuery,
    | 'locale'
    | 'selectedCategorySlug'
    | 'selectedSearchQuery'
    | 'tasteFilter'
    | 'minPriceAmd'
    | 'maxPriceAmd'
    | 'requestedPage'
    | 'menuFast'
  >
): Promise<ComboMenuProductsPage> {
  const startedAt = Date.now();
  const productWhereBase = buildComboProductWhereBase(query.locale, query as ComboMenuQuery);
  const { productTotal, productRows } = await withPrismaResilience(
    () => fetchComboProductsPage(query.locale, query, productWhereBase),
    { productTotal: 0, productRows: [] as ShopMenuProductRow[] },
    'COMBO',
    'product list'
  );
  logger.info('[COMBO PERF] products query complete', {
    locale: query.locale,
    category: query.selectedCategorySlug || 'all',
    page: query.requestedPage,
    searchLength: query.selectedSearchQuery.length,
    rows: productRows.length,
    total: productTotal,
    menuFast: query.menuFast === true,
    durationMs: Date.now() - startedAt,
  });

  return mapComboProductsPage(
    query.locale,
    productTotal,
    productRows,
    query.requestedPage
  );
}

const getComboMenuSidebarCached = unstable_cache(
  async (
    locale: StorefrontLocale,
    selectedSearchQuery: string,
    tasteFilter: '' | 'leaf' | 'pepper',
    minPriceAmdKey: string,
    maxPriceAmdKey: string
  ) => {
    const minPriceAmd = minPriceAmdKey === '' ? null : Number(minPriceAmdKey);
    const maxPriceAmd = maxPriceAmdKey === '' ? null : Number(maxPriceAmdKey);

    return loadComboMenuSidebar({
      locale,
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
    });
  },
  ['combo-sidebar-v1'],
  {
    revalidate: 300,
    tags: [COMBO_MENU_CACHE_TAG],
  }
);

const getComboMenuProductsCached = unstable_cache(
  async (
    locale: StorefrontLocale,
    selectedCategorySlug: string,
    selectedSearchQuery: string,
    tasteFilter: '' | 'leaf' | 'pepper',
    minPriceAmdKey: string,
    maxPriceAmdKey: string,
    requestedPageKey: string,
    menuFastKey: '0' | '1'
  ) => {
    const parsedPage = parseInt(requestedPageKey, 10);
    const minPriceAmd = minPriceAmdKey === '' ? null : Number(minPriceAmdKey);
    const maxPriceAmd = maxPriceAmdKey === '' ? null : Number(maxPriceAmdKey);

    return loadComboMenuProducts({
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
      menuFast: menuFastKey === '1',
    });
  },
  ['combo-products-v1'],
  {
    revalidate: COMBO_MENU_REVALIDATE_SECONDS,
    tags: [COMBO_MENU_CACHE_TAG],
  }
);

/** Product grid only — used by soft category navigation API. */
export async function getComboMenuProductsPageWithMetrics(
  query: Pick<
    ComboMenuQuery,
    | 'locale'
    | 'selectedCategorySlug'
    | 'selectedSearchQuery'
    | 'tasteFilter'
    | 'minPriceAmd'
    | 'maxPriceAmd'
    | 'requestedPage'
    | 'menuFast'
  >
): Promise<{ data: ComboMenuProductsPage; metrics: ComboMenuProductsMetrics }> {
  const serviceStartedAt = Date.now();
  const data = await getComboMenuProductsCached(
    query.locale,
    query.selectedCategorySlug,
    query.selectedSearchQuery,
    query.tasteFilter ?? '',
    query.minPriceAmd === null ? '' : String(query.minPriceAmd),
    query.maxPriceAmd === null ? '' : String(query.maxPriceAmd),
    String(query.requestedPage),
    query.menuFast ? '1' : '0'
  );
  return {
    data,
    metrics: {
      totalServiceMs: Date.now() - serviceStartedAt,
    },
  };
}

/** Product grid only — used by soft category navigation API. */
export async function getComboMenuProductsPage(
  query: Pick<
    ComboMenuQuery,
    | 'locale'
    | 'selectedCategorySlug'
    | 'selectedSearchQuery'
    | 'tasteFilter'
    | 'minPriceAmd'
    | 'maxPriceAmd'
    | 'requestedPage'
    | 'menuFast'
  >
): Promise<ComboMenuProductsPage> {
  const { data } = await getComboMenuProductsPageWithMetrics(query);
  return data;
}

/**
 * Sidebar categories for combo menu routes (cached 5 min).
 */
export function getComboMenuSidebarPayload(filter: ComboMenuFilterKey): Promise<ComboMenuSidebarPayload> {
  return getComboMenuSidebarCached(
    filter.locale,
    filter.selectedSearchQuery,
    filter.tasteFilter ?? '',
    filter.minPriceAmd === null ? '' : String(filter.minPriceAmd),
    filter.maxPriceAmd === null ? '' : String(filter.maxPriceAmd)
  );
}

/**
 * Loads combo menu categories, product counts, and paginated product cards from the database.
 */
export async function loadComboMenuData(query: ComboMenuQuery): Promise<ComboMenuData> {
  if (query.loadProfile === 'products-only') {
    const products = await loadComboMenuProducts(query);
    return {
      ...products,
      categories: [],
      showCategoryPicker: true,
    };
  }

  const filterKey: ComboMenuFilterKey = {
    locale: query.locale,
    selectedSearchQuery: query.selectedSearchQuery,
    tasteFilter: query.tasteFilter,
    minPriceAmd: query.minPriceAmd,
    maxPriceAmd: query.maxPriceAmd,
  };

  const [sidebar, products] = await Promise.all([
    withPrismaResilience(
      () => loadComboMenuSidebar(filterKey),
      EMPTY_COMBO_MENU_SIDEBAR_PAYLOAD,
      'COMBO',
      'sidebar'
    ),
    loadComboMenuProducts(query),
  ]);

  return {
    ...sidebar,
    ...products,
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
    requestedPageKey: string,
    loadProfileKey: ComboMenuQuery['loadProfile'],
    menuFastKey: '0' | '1'
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
      loadProfile: loadProfileKey,
      menuFast: menuFastKey === '1',
    });
  },
  ['combo-menu-data-v4'],
  {
    revalidate: COMBO_MENU_REVALIDATE_SECONDS,
    tags: [COMBO_MENU_CACHE_TAG],
  }
);

/**
 * Combo menu payload with per-query Data Cache (60s TTL, invalidated via `COMBO_MENU_CACHE_TAG`).
 * Full profile loads sidebar + products from separate cache entries (category switch reuses sidebar).
 */
export function getComboMenuData(query: ComboMenuQuery): Promise<ComboMenuData> {
  if (query.loadProfile === 'full') {
    return Promise.all([
      getComboMenuSidebarCached(
        query.locale,
        query.selectedSearchQuery,
        query.tasteFilter ?? '',
        query.minPriceAmd === null ? '' : String(query.minPriceAmd),
        query.maxPriceAmd === null ? '' : String(query.maxPriceAmd)
      ),
      getComboMenuProductsPage({
        locale: query.locale,
        selectedCategorySlug: query.selectedCategorySlug,
        selectedSearchQuery: query.selectedSearchQuery,
        tasteFilter: query.tasteFilter,
        minPriceAmd: query.minPriceAmd,
        maxPriceAmd: query.maxPriceAmd,
        requestedPage: query.requestedPage,
        menuFast: query.menuFast,
      }),
    ])
      .then(([sidebar, products]) => {
        const safeSidebar = sidebar ?? EMPTY_COMBO_MENU_SIDEBAR_PAYLOAD;
        const safeProducts = products ?? EMPTY_COMBO_MENU_PRODUCTS_PAGE;
        return {
          ...safeSidebar,
          ...safeProducts,
        };
      })
      .catch((error: unknown) => {
        logger.warn('[COMBO] Full payload failed; using safe fallback', {
          category: query.selectedCategorySlug || 'all',
          page: query.requestedPage,
          error: error instanceof Error ? error.message : String(error),
        });
        return EMPTY_COMBO_MENU_DATA;
      });
  }

  return getComboMenuDataCached(
    query.locale,
    query.selectedCategorySlug,
    query.selectedSearchQuery,
    query.tasteFilter ?? '',
    query.minPriceAmd === null ? '' : String(query.minPriceAmd),
    query.maxPriceAmd === null ? '' : String(query.maxPriceAmd),
    String(query.requestedPage),
    query.loadProfile,
    query.menuFast ? '1' : '0'
  ).catch((error: unknown) => {
    logger.warn('[COMBO] Menu payload failed; using safe fallback', {
      category: query.selectedCategorySlug || 'all',
      page: query.requestedPage,
      error: error instanceof Error ? error.message : String(error),
    });
    return EMPTY_COMBO_MENU_DATA;
  });
}
