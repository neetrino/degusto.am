import { STORE_MENU_PAGE_SIZE } from '@/constants/store-menu-page-size';
import { db } from '@white-shop/db';
import type { Prisma } from '@prisma/client';
import { logger } from '@/lib/utils/logger';
import { enrichShopMenuProductRows } from './shop-menu-product-enrich';
import type { ShopMenuProductRow } from './shop-page-data.helpers';
import { getShopMenuProductSelect } from './shop-menu-product-select';
import type { StorefrontLocale } from '@/lib/i18n/locale';

export type ShopMenuProductPageFetchResult = {
  productTotal: number;
  productRows: ShopMenuProductRow[];
};

type FetchShopMenuProductPageParams = {
  locale: StorefrontLocale;
  requestedPage: number;
  productWhere: Prisma.ProductWhereInput;
  perfLabel: 'SHOP' | 'COMBO';
};

function deriveExactProductTotal(
  requestedPage: number,
  rowCount: number
): number {
  return (requestedPage - 1) * STORE_MENU_PAGE_SIZE + rowCount;
}

async function loadProductRowsPage(
  locale: StorefrontLocale,
  productWhere: Prisma.ProductWhereInput,
  requestedPage: number,
  take: number
): Promise<ShopMenuProductRow[]> {
  const rows = await db.product.findMany({
    where: productWhere,
    orderBy: {
      updatedAt: 'desc',
    },
    skip: (requestedPage - 1) * STORE_MENU_PAGE_SIZE,
    take,
    select: getShopMenuProductSelect(locale),
  });

  return enrichShopMenuProductRows(
    rows as unknown as Omit<ShopMenuProductRow, 'reviews' | 'averageRating'>[]
  );
}

/**
 * Paginated menu products with optional count skip (fetch PAGE_SIZE+1 probe).
 */
export async function fetchShopMenuProductPage({
  locale,
  requestedPage,
  productWhere,
  perfLabel,
}: FetchShopMenuProductPageParams): Promise<ShopMenuProductPageFetchResult> {
  const rowsStartedAt = Date.now();
  const probedRows = await loadProductRowsPage(
    locale,
    productWhere,
    requestedPage,
    STORE_MENU_PAGE_SIZE + 1
  );
  const dbRowsMs = Date.now() - rowsStartedAt;

  const hasMore = probedRows.length > STORE_MENU_PAGE_SIZE;
  const productRows = hasMore ? probedRows.slice(0, STORE_MENU_PAGE_SIZE) : probedRows;

  let productTotal: number;
  let dbCountMs = 0;

  if (hasMore) {
    const countStartedAt = Date.now();
    productTotal = await db.product.count({ where: productWhere });
    dbCountMs = Date.now() - countStartedAt;
  } else {
    productTotal = deriveExactProductTotal(requestedPage, productRows.length);
  }

  logger.info(`[${perfLabel} PERF] db product page query timings`, {
    locale,
    page: requestedPage,
    dbCountMs,
    dbRowsMs,
    productTotal,
    rowCount: productRows.length,
    countSkipped: !hasMore,
  });

  const totalPages =
    productTotal === 0 ? 0 : Math.ceil(productTotal / STORE_MENU_PAGE_SIZE);
  const effectivePage = totalPages === 0 ? 1 : Math.min(requestedPage, totalPages);

  if (effectivePage === requestedPage) {
    return {
      productTotal,
      productRows,
    };
  }

  const clampStartedAt = Date.now();
  const clampedRows = await loadProductRowsPage(
    locale,
    productWhere,
    effectivePage,
    STORE_MENU_PAGE_SIZE
  );
  logger.info(`[${perfLabel} PERF] db clamped product page query timing`, {
    locale,
    requestedPage,
    effectivePage,
    dbClampRowsMs: Date.now() - clampStartedAt,
    rowCount: clampedRows.length,
  });

  return {
    productTotal,
    productRows: clampedRows,
  };
}
