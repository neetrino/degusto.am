import { unstable_cache } from 'next/cache';
import { STOREFRONT_ISR_REVALIDATE_SECONDS } from '@/constants/storefront-isr';
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
import { logger } from '@/lib/utils/logger';
import {
  buildShopProductWhere,
  buildShopProductWhereBase,
} from './shop-page-product-where';
import { fetchShopMenuProductPage } from './fetch-shop-menu-product-page';
import type {
  ShopMenuData,
  ShopMenuDbResult,
  ShopMenuLoadProfile,
  ShopMenuQuery,
} from './shop-page-query.types';

export type {
  ShopMenuData,
  ShopMenuLoadProfile,
  ShopMenuQuery,
  ShopMobileCategoryCard,
} from './shop-page-query.types';

export type ShopMenuProductsPage = Pick<ShopMenuData, 'cards' | 'effectivePage' | 'totalPages'>;
export type ShopMenuProductsMetrics = {
  totalServiceMs: number;
};

export type ShopMenuSidebarPayload = Pick<
  ShopMenuData,
  'categories' | 'mobileShopCategories' | 'showCategoryPicker'
>;

type ShopMenuFilterKey = {
  locale: StorefrontLocale;
  selectedSearchQuery: string;
  tasteFilter: 'leaf' | 'pepper' | null;
  minPriceAmd: number | null;
  maxPriceAmd: number | null;
};

/** Shared cache tag for `revalidateTag` on product/category admin writes. */
export const SHOP_MENU_CACHE_TAG = 'shop-menu';

export const SHOP_MENU_REVALIDATE_SECONDS = STOREFRONT_ISR_REVALIDATE_SECONDS;

const CATEGORY_LIST_WHERE = {
  published: true,
  deletedAt: null,
  translations: {
    none: {
      locale: 'en',
      slug: 'combo',
    },
  },
} as const;

const CATEGORY_LIST_SELECT = {
  id: true,
  media: true,
  translations: {
    select: {
      locale: true,
      title: true,
      slug: true,
    },
  },
} as const;

type CategoryRow = ShopMenuDbResult['categoryRows'][number];

async function fetchShopCategoryRows(locale: StorefrontLocale): Promise<CategoryRow[]> {
  return db.category.findMany({
    where: CATEGORY_LIST_WHERE,
    orderBy: {
      position: 'asc',
    },
    select: {
      ...CATEGORY_LIST_SELECT,
      translations: {
        where: {
          locale: {
            in: [locale, 'en'],
          },
        },
        select: CATEGORY_LIST_SELECT.translations.select,
      },
    },
  });
}

async function fetchShopProductPage(
  locale: StorefrontLocale,
  query: Pick<
    ShopMenuQuery,
    | 'selectedCategorySlug'
    | 'selectedSearchQuery'
    | 'tasteFilter'
    | 'minPriceAmd'
    | 'maxPriceAmd'
    | 'requestedPage'
  >,
  productWhereBase: ReturnType<typeof buildShopProductWhereBase>
): Promise<Pick<ShopMenuDbResult, 'productTotal' | 'productRows'>> {
  const productWhere = buildShopProductWhere(locale, query as ShopMenuQuery, productWhereBase);
  return fetchShopMenuProductPage({
    locale,
    requestedPage: query.requestedPage,
    productWhere,
    perfLabel: 'SHOP',
  });
}

function mapProductsPage(
  locale: StorefrontLocale,
  productTotal: number,
  productRows: ShopMenuProductRow[],
  requestedPage: number
): ShopMenuProductsPage {
  const totalPages =
    productTotal === 0 ? 0 : Math.ceil(productTotal / STORE_MENU_PAGE_SIZE);
  const effectivePage = totalPages === 0 ? 1 : Math.min(requestedPage, totalPages);

  return {
    cards: mapShopProductRowsToMenuCards(locale, productRows),
    effectivePage,
    totalPages,
  };
}

async function loadShopMenuSidebar(filter: ShopMenuFilterKey): Promise<ShopMenuSidebarPayload> {
  const startedAt = Date.now();
  const allCategoriesLabel = filter.locale === 'hy' ? 'Բոլորը' : 'All';
  const filterQuery: ShopMenuQuery = {
    ...filter,
    selectedCategorySlug: '',
    requestedPage: 1,
    loadProfile: 'full',
  };

  const categoryRows = await fetchShopCategoryRows(filter.locale);
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
      const counts = await fetchShopMenuCategoryProductCounts(
        filter.locale,
        filterQuery,
        slugsToCount
      );
      allProductCount = counts.allProductCount;
      countBySlug = counts.countBySlug;
    } catch (countsError) {
      logger.error('[SHOP] Category product counts failed', countsError);
    }
  }

  const slugToProductCount = new Map<string, number>(Object.entries(countBySlug));
  logger.info('[SHOP PERF] sidebar query complete', {
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
    mobileShopCategories: mapCategoryEntriesToMobileCategories(
      categoryEntries,
      allProductCount,
      slugToProductCount,
      !shouldSkipCountsForFastFirstOpen
    ),
    showCategoryPicker: categoryEntries.length > 0,
  };
}

async function loadShopMenuProducts(
  query: Pick<
    ShopMenuQuery,
    | 'locale'
    | 'selectedCategorySlug'
    | 'selectedSearchQuery'
    | 'tasteFilter'
    | 'minPriceAmd'
    | 'maxPriceAmd'
    | 'requestedPage'
  >
): Promise<ShopMenuProductsPage> {
  const startedAt = Date.now();
  const productWhereBase = buildShopProductWhereBase(query.locale, query as ShopMenuQuery);
  const { productTotal, productRows } = await withPrismaResilience(
    () => fetchShopProductPage(query.locale, query, productWhereBase),
    { productTotal: 0, productRows: [] },
    'SHOP',
    'product list'
  );
  logger.info('[SHOP PERF] products query complete', {
    locale: query.locale,
    category: query.selectedCategorySlug || 'all',
    page: query.requestedPage,
    searchLength: query.selectedSearchQuery.length,
    rows: productRows.length,
    total: productTotal,
    durationMs: Date.now() - startedAt,
  });

  return mapProductsPage(
    query.locale,
    productTotal,
    productRows,
    query.requestedPage
  );
}

const getShopMenuSidebarCached = unstable_cache(
  async (
    locale: StorefrontLocale,
    selectedSearchQuery: string,
    tasteFilter: '' | 'leaf' | 'pepper',
    minPriceAmdKey: string,
    maxPriceAmdKey: string
  ) => {
    const minPriceAmd = minPriceAmdKey === '' ? null : Number(minPriceAmdKey);
    const maxPriceAmd = maxPriceAmdKey === '' ? null : Number(maxPriceAmdKey);

    return loadShopMenuSidebar({
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
  ['shop-sidebar-v1'],
  {
    revalidate: SHOP_MENU_REVALIDATE_SECONDS,
    tags: [SHOP_MENU_CACHE_TAG],
  }
);

const getShopMenuProductsCached = unstable_cache(
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

    return loadShopMenuProducts({
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
  ['shop-products-v1'],
  {
    revalidate: SHOP_MENU_REVALIDATE_SECONDS,
    tags: [SHOP_MENU_CACHE_TAG],
  }
);

/** Product grid only — used by soft category navigation API. */
export async function getShopMenuProductsPageWithMetrics(
  query: Pick<
    ShopMenuQuery,
    | 'locale'
    | 'selectedCategorySlug'
    | 'selectedSearchQuery'
    | 'tasteFilter'
    | 'minPriceAmd'
    | 'maxPriceAmd'
    | 'requestedPage'
  >
): Promise<{ data: ShopMenuProductsPage; metrics: ShopMenuProductsMetrics }> {
  const serviceStartedAt = Date.now();
  const data = await getShopMenuProductsCached(
    query.locale,
    query.selectedCategorySlug,
    query.selectedSearchQuery,
    query.tasteFilter ?? '',
    query.minPriceAmd === null ? '' : String(query.minPriceAmd),
    query.maxPriceAmd === null ? '' : String(query.maxPriceAmd),
    String(query.requestedPage)
  );
  const totalServiceMs = Date.now() - serviceStartedAt;
  return {
    data,
    metrics: {
      totalServiceMs,
    },
  };
}

/** Product grid only — used by soft category navigation API. */
export async function getShopMenuProductsPage(
  query: Pick<
    ShopMenuQuery,
    | 'locale'
    | 'selectedCategorySlug'
    | 'selectedSearchQuery'
    | 'tasteFilter'
    | 'minPriceAmd'
    | 'maxPriceAmd'
    | 'requestedPage'
  >
): Promise<ShopMenuProductsPage> {
  const { data } = await getShopMenuProductsPageWithMetrics(query);
  return data;
}

/**
 * Loads shop menu categories, product counts, and paginated product cards from the database.
 */
export async function loadShopMenuData(query: ShopMenuQuery): Promise<ShopMenuData> {
  const { locale, loadProfile } = query;

  if (loadProfile === 'products-only') {
    const products = await loadShopMenuProducts(query);
    return {
      ...products,
      categories: [],
      mobileShopCategories: [],
      showCategoryPicker: true,
    };
  }

  if (loadProfile === 'mobile-grid') {
    const allCategoriesLabel = locale === 'hy' ? 'Բոլորը' : 'All';
    const sidebar = await loadShopMenuSidebar({
      locale: query.locale,
      selectedSearchQuery: query.selectedSearchQuery,
      tasteFilter: query.tasteFilter,
      minPriceAmd: query.minPriceAmd,
      maxPriceAmd: query.maxPriceAmd,
    });

    return {
      cards: [],
      effectivePage: 1,
      totalPages: 0,
      ...sidebar,
    };
  }

  const filterKey = {
    locale: query.locale,
    selectedSearchQuery: query.selectedSearchQuery,
    tasteFilter: query.tasteFilter,
    minPriceAmd: query.minPriceAmd,
    maxPriceAmd: query.maxPriceAmd,
  };

  const [sidebar, products] = await Promise.all([
    loadShopMenuSidebar(filterKey),
    loadShopMenuProducts(query),
  ]);

  return {
    ...sidebar,
    ...products,
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
    loadProfileKey: ShopMenuLoadProfile
  ) => {
    const parsedPage = parseInt(requestedPageKey, 10);
    const minPriceAmd = minPriceAmdKey === '' ? null : Number(minPriceAmdKey);
    const maxPriceAmd = maxPriceAmdKey === '' ? null : Number(maxPriceAmdKey);

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
      requestedPage: Number.isFinite(parsedPage) && parsedPage >= 1 ? parsedPage : 1,
      loadProfile: loadProfileKey,
    });
  },
  ['shop-menu-data-v6'],
  {
    revalidate: SHOP_MENU_REVALIDATE_SECONDS,
    tags: [SHOP_MENU_CACHE_TAG],
  }
);

/**
 * Shop menu payload with per-query Data Cache (24h TTL, invalidated via `SHOP_MENU_CACHE_TAG`).
 * Desktop `full` profile loads sidebar + products from separate cache entries (category switch reuses sidebar).
 */
export function getShopMenuData(query: ShopMenuQuery): Promise<ShopMenuData> {
  if (query.loadProfile === 'full') {
    return Promise.all([
      getShopMenuSidebarCached(
        query.locale,
        query.selectedSearchQuery,
        query.tasteFilter ?? '',
        query.minPriceAmd === null ? '' : String(query.minPriceAmd),
        query.maxPriceAmd === null ? '' : String(query.maxPriceAmd)
      ),
      getShopMenuProductsPage(query),
    ]).then(([sidebar, products]) => ({
      ...sidebar,
      ...products,
    }));
  }

  return getShopMenuDataCached(
    query.locale,
    query.selectedCategorySlug,
    query.selectedSearchQuery,
    query.tasteFilter ?? '',
    query.minPriceAmd === null ? '' : String(query.minPriceAmd),
    query.maxPriceAmd === null ? '' : String(query.maxPriceAmd),
    String(query.requestedPage),
    query.loadProfile
  );
}
