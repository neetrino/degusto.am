'use client';

import { useMemo, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@shop/ui';
import { useTranslation } from '../../../../lib/i18n-client';
import { formatPrice, type CurrencyCode } from '../../../../lib/currency';
import {
  ADMIN_TABLE,
  ADMIN_TABLE_CHECKBOX,
  ADMIN_TABLE_FOOTER_ROUNDED_B,
  ADMIN_TABLE_OUTER_SCROLL,
  ADMIN_TABLE_TBODY,
  ADMIN_TABLE_TD,
  ADMIN_TABLE_TD_CHECK,
  ADMIN_TABLE_TH,
  ADMIN_TABLE_TH_CENTER,
  ADMIN_TABLE_TH_CHECK,
  ADMIN_TABLE_TH_SORTABLE,
} from '../../constants/admin-table-classes';
import type { Product, ProductsResponse } from '../types';
import type { DailyOfferSelection } from '@/lib/services/daily-offer/daily-offer.types';
import { ProductFeaturedCell } from './ProductFeaturedCell';

interface ProductsTableProps {
  loading: boolean;
  sortedProducts: Product[];
  products: Product[];
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  toggleSelectAll: () => void;
  sortBy: string;
  handleHeaderSort: (field: 'price' | 'createdAt' | 'title') => void;
  currency: CurrencyCode;
  handleDeleteProduct: (productId: string, productTitle: string) => void;
  handleDuplicateProduct: (productId: string) => void;
  duplicatingProductId: string | null;
  handleTogglePublished: (productId: string, currentStatus: boolean, productTitle: string) => void;
  handleToggleFeatured: (productId: string, currentStatus: boolean, productTitle: string) => void;
  handleToggleDailyOffer: (productId: string) => void;
  dailyOfferSelection: DailyOfferSelection;
  togglingDailyOfferProductId: string | null;
  meta: ProductsResponse['meta'] | null;
  page: number;
  setPage: (page: number | ((prev: number) => number)) => void;
}

/**
 * Helper function to process image URLs
 * Handles relative paths, absolute URLs and base64
 */
const processImageUrl = (url: string | null) => {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // For relative paths, ensure they start with a slash
  return url.startsWith('/') ? url : `/${url}`;
};

const PAGE_CHUNK_SIZE = 3;

function getPaginationWindow(currentPage: number, totalPages: number) {
  if (totalPages <= 10) {
    return {
      start: 1,
      end: totalPages,
    };
  }

  const chunkIndex = Math.floor((currentPage - 1) / PAGE_CHUNK_SIZE);
  const start = chunkIndex * PAGE_CHUNK_SIZE + 1;
  const end = Math.min(totalPages, start + PAGE_CHUNK_SIZE - 1);
  return { start, end };
}

function getVisiblePages(start: number, end: number) {
  const pages: number[] = [];
  for (let currentPage = start; currentPage <= end; currentPage++) {
    pages.push(currentPage);
  }
  return pages;
}

const INTERACTIVE_CELL_SELECTOR = 'button, input, a, textarea, select, [role="button"]';

function isProductDailyOffer(productId: string, selection: DailyOfferSelection): boolean {
  return (
    selection.mobileProductId === productId && selection.desktopProductId === productId
  );
}

function handleProductRowClick(
  event: MouseEvent<HTMLTableRowElement>,
  productId: string,
  openProductEditor: (id: string) => void,
) {
  const clickedElement = event.target;
  if (clickedElement instanceof HTMLElement && clickedElement.closest(INTERACTIVE_CELL_SELECTOR)) {
    return;
  }
  openProductEditor(productId);
}

interface ProductsTableLoadedViewProps {
  sortedProducts: Product[];
  products: Product[];
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  toggleSelectAll: () => void;
  sortBy: string;
  handleHeaderSort: (field: 'price' | 'createdAt' | 'title') => void;
  currency: CurrencyCode;
  handleDeleteProduct: (productId: string, productTitle: string) => void;
  handleDuplicateProduct: (productId: string) => void;
  duplicatingProductId: string | null;
  handleTogglePublished: (productId: string, currentStatus: boolean, productTitle: string) => void;
  handleToggleFeatured: (productId: string, currentStatus: boolean, productTitle: string) => void;
  handleToggleDailyOffer: (productId: string) => void;
  dailyOfferSelection: DailyOfferSelection;
  togglingDailyOfferProductId: string | null;
  meta: ProductsResponse['meta'] | null;
  page: number;
  t: (key: string) => string;
  openProductEditor: (id: string) => void;
  goToPage: (targetPage: number) => void;
  paginationWindow: { start: number; end: number };
  visiblePages: number[];
}

interface ProductsTablePaginationProps {
  meta: NonNullable<ProductsResponse['meta']>;
  page: number;
  t: (key: string) => string;
  goToPage: (targetPage: number) => void;
  paginationWindow: { start: number; end: number };
  visiblePages: number[];
}

function ProductsTablePagination({
  meta,
  page,
  t,
  goToPage,
  paginationWindow,
  visiblePages,
}: ProductsTablePaginationProps) {
  if (meta.totalPages <= 1) {
    return null;
  }

  return (
    <div className={`${ADMIN_TABLE_FOOTER_ROUNDED_B} flex items-center justify-between border-t border-[#e8ede8] bg-[#fbfdfb]`}>
      <div className="text-sm text-[#5a6f62]">
        {t('admin.products.showingPage').replace('{page}', meta.page.toString()).replace('{totalPages}', meta.totalPages.toString()).replace('{total}', meta.total.toString())}
      </div>
      <div className="flex items-center gap-2 flex-wrap justify-end">
        {meta.totalPages > 10 && (
          <Button
            variant="ghost"
            onClick={() => goToPage(paginationWindow.start - PAGE_CHUNK_SIZE)}
            disabled={paginationWindow.start <= 1}
            className="rounded-lg border border-[#dce3dd] bg-white text-[#365744] hover:bg-[#eef3ef]"
          >
            -{PAGE_CHUNK_SIZE}
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={() => goToPage(page - 1)}
          disabled={page === 1}
          className="rounded-lg border border-[#dce3dd] bg-white text-[#365744] hover:bg-[#eef3ef]"
        >
          {t('admin.products.previous')}
        </Button>
        {visiblePages.map((visiblePage) => (
          <Button
            key={visiblePage}
            variant={page === visiblePage ? 'primary' : 'ghost'}
            onClick={() => goToPage(visiblePage)}
            className={
              page === visiblePage
                ? 'rounded-lg border border-[#0f5a3d] bg-[#0f5a3d] text-white'
                : 'rounded-lg border border-[#dce3dd] bg-white text-[#365744] hover:bg-[#eef3ef]'
            }
          >
            {visiblePage}
          </Button>
        ))}
        <Button
          variant="ghost"
          onClick={() => goToPage(page + 1)}
          disabled={page === meta.totalPages}
          className="rounded-lg border border-[#dce3dd] bg-white text-[#365744] hover:bg-[#eef3ef]"
        >
          {t('admin.products.next')}
        </Button>
        {meta.totalPages > 10 && (
          <Button
            variant="ghost"
            onClick={() => goToPage(paginationWindow.end + 1)}
            disabled={paginationWindow.end >= meta.totalPages}
            className="rounded-lg border border-[#dce3dd] bg-white text-[#365744] hover:bg-[#eef3ef]"
          >
            +{PAGE_CHUNK_SIZE}
          </Button>
        )}
      </div>
    </div>
  );
}

function ProductsTableLoadedView({
  sortedProducts,
  products,
  selectedIds,
  toggleSelect,
  toggleSelectAll,
  sortBy,
  handleHeaderSort,
  currency,
  handleDeleteProduct,
  handleDuplicateProduct,
  duplicatingProductId,
  handleTogglePublished,
  handleToggleFeatured,
  handleToggleDailyOffer,
  dailyOfferSelection,
  togglingDailyOfferProductId,
  meta,
  page,
  t,
  openProductEditor,
  goToPage,
  paginationWindow,
  visiblePages,
}: ProductsTableLoadedViewProps) {
  return (
    <>
      <div className={ADMIN_TABLE_OUTER_SCROLL}>
        <table className={ADMIN_TABLE}>
          <thead className="border-b border-[#15543a] bg-gradient-to-r from-[#0f5a3d] to-[#0b6a45]">
            <tr>
              <th className={ADMIN_TABLE_TH_CHECK}>
                <input
                  type="checkbox"
                  className={`${ADMIN_TABLE_CHECKBOX} border-white/60 bg-white/20`}
                  aria-label={t('admin.products.selectAll')}
                  checked={products.length > 0 && products.every(p => selectedIds.has(p.id))}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="p-0 align-middle">
                <button
                  type="button"
                  onClick={() => handleHeaderSort('title')}
                  className={`${ADMIN_TABLE_TH_SORTABLE} inline-flex w-full items-center gap-1 text-[#eef9f2] hover:bg-white/10`}
                >
                  <span>{t('admin.products.product')}</span>
                  <span className="flex flex-col gap-0.5">
                    <svg
                      className={`w-2.5 h-2.5 ${
                        sortBy === 'title-asc'
                          ? 'text-gray-900'
                          : 'text-gray-400'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    <svg
                      className={`w-2.5 h-2.5 ${
                        sortBy === 'title-desc'
                          ? 'text-gray-900'
                          : 'text-gray-400'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>
              </th>
              <th className="p-0 align-middle">
                <button
                  type="button"
                  onClick={() => handleHeaderSort('price')}
                  className={`${ADMIN_TABLE_TH_SORTABLE} inline-flex w-full items-center gap-1 text-[#eef9f2] hover:bg-white/10`}
                >
                  <span>{t('admin.products.price')}</span>
                  <span className="flex flex-col gap-0.5">
                    <svg
                      className={`w-2.5 h-2.5 ${
                        sortBy === 'price-asc'
                          ? 'text-gray-900'
                          : 'text-gray-400'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    <svg
                      className={`w-2.5 h-2.5 ${
                        sortBy === 'price-desc'
                          ? 'text-gray-900'
                          : 'text-gray-400'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>
              </th>
              <th className={`${ADMIN_TABLE_TH} text-[#eef9f2]`}>{t('admin.products.category')}</th>
              <th className={`${ADMIN_TABLE_TH_CENTER} text-[#eef9f2]`}>{t('admin.products.featured')}</th>
              <th className={`${ADMIN_TABLE_TH_CENTER} text-[#eef9f2]`}>{t('admin.products.actions')}</th>
              <th className="p-0 align-middle">
                <button
                  type="button"
                  onClick={() => handleHeaderSort('createdAt')}
                  className={`${ADMIN_TABLE_TH_SORTABLE} inline-flex w-full items-center gap-1 text-[#eef9f2] hover:bg-white/10`}
                >
                  <span>{t('admin.products.created')}</span>
                  <span className="flex flex-col gap-0.5">
                    <svg
                      className={`w-2.5 h-2.5 ${
                        sortBy === 'createdAt-asc'
                          ? 'text-gray-900'
                          : 'text-gray-400'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    <svg
                      className={`w-2.5 h-2.5 ${
                        sortBy === 'createdAt-desc'
                          ? 'text-gray-900'
                          : 'text-gray-400'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>
              </th>
            </tr>
          </thead>
          <tbody className={`${ADMIN_TABLE_TBODY} [&>tr:hover]:bg-[#f7faf7]`}>
            {sortedProducts.map((product) => (
              <tr
                key={product.id}
                className="cursor-pointer transition-colors"
                onClick={(event) => handleProductRowClick(event, product.id, openProductEditor)}
              >
                <td className={ADMIN_TABLE_TD_CHECK}>
                  <div className="flex min-w-0 justify-center">
                    <input
                      type="checkbox"
                      className={ADMIN_TABLE_CHECKBOX}
                      aria-label={t('admin.products.selectProduct').replace('{title}', product.title)}
                      checked={selectedIds.has(product.id)}
                      onChange={() => toggleSelect(product.id)}
                    />
                  </div>
                </td>
                <td className={`${ADMIN_TABLE_TD} whitespace-nowrap text-left text-[#22352a]`}>
                  <div className="flex items-center">
                    {product.image && (
                      <img
                        src={processImageUrl(product.image)}
                        alt={product.title}
                        className="h-12 w-12 rounded object-cover mr-3"
                      />
                    )}
                    <div>
                      <div className="text-sm font-semibold text-[#22352a]">{product.title}</div>
                    </div>
                  </div>
                </td>
                <td className={`${ADMIN_TABLE_TD} whitespace-nowrap text-left font-semibold text-[#22352a]`}>
                  <div className="flex flex-col">
                      <div className="text-sm font-medium text-[#22352a]">
                      {formatPrice(product.price, currency)}
                    </div>
                    {(product.compareAtPrice && product.compareAtPrice > product.price) || (product.discountPercent && product.discountPercent > 0) ? (
                      <div className="text-xs text-gray-500 line-through mt-0.5">
                        {formatPrice(
                          product.compareAtPrice && product.compareAtPrice > product.price
                            ? product.compareAtPrice
                            : product.price / (1 - (product.discountPercent || 0) / 100),
                          currency
                        )}
                      </div>
                    ) : null}
                  </div>
                </td>
                <td className={`${ADMIN_TABLE_TD} min-w-0 max-w-[14rem] text-left text-[#22352a]`}>
                  {product.categorySummary ? (
                    <span className="block truncate" title={product.categorySummary}>
                      {product.categorySummary}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className={`${ADMIN_TABLE_TD} whitespace-nowrap text-center`}>
                  <ProductFeaturedCell
                    isDailyOffer={isProductDailyOffer(product.id, dailyOfferSelection)}
                    featured={product.featured || false}
                    togglingDailyOffer={togglingDailyOfferProductId === product.id}
                    onToggleFeatured={(event) => {
                      event.stopPropagation();
                      handleToggleFeatured(product.id, product.featured || false, product.title);
                    }}
                    onToggleDailyOffer={(event) => {
                      event.stopPropagation();
                      void handleToggleDailyOffer(product.id);
                    }}
                  />
                </td>
                <td className={`${ADMIN_TABLE_TD} whitespace-nowrap text-center font-medium text-[#22352a]`}>
                  <div className="flex items-center justify-center gap-1 flex-wrap">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => openProductEditor(product.id)}
                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      aria-label={t('admin.products.edit')}
                      title={t('admin.products.edit')}
                    >
                      <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Button>
                    <button
                      type="button"
                      disabled={duplicatingProductId === product.id}
                      onClick={() => handleDuplicateProduct(product.id)}
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-[6px] transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 ${
                        duplicatingProductId === product.id
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-transparent text-gray-900 hover:bg-gray-100'
                      }`}
                      aria-label={t('admin.products.duplicate')}
                      title={t('admin.products.duplicateHint')}
                    >
                      {duplicatingProductId === product.id ? (
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <circle cx="12" cy="12" r="9" className="opacity-30" stroke="currentColor" strokeWidth="2.5" />
                          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <rect x="4.5" y="7.5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
                          <path d="M9 3.5h8a2 2 0 0 1 2 2v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path d="M9.6 13h4.8M12 10.6v4.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      )}
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteProduct(product.id, product.title)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      aria-label={t('admin.products.delete')}
                      title={t('admin.products.delete')}
                    >
                      <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                    <button
                      type="button"
                      onClick={() => handleTogglePublished(product.id, product.published, product.title)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        product.published
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                      }`}
                      title={product.published ? t('admin.products.clickToDraft') : t('admin.products.clickToPublished')}
                      aria-label={product.published ? `${t('admin.products.published')} - ${t('admin.products.clickToDraft')}` : `${t('admin.products.draft')} - ${t('admin.products.clickToPublished')}`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${
                          product.published ? 'translate-x-[18px]' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </td>
                <td className={`${ADMIN_TABLE_TD} whitespace-nowrap text-left tabular-nums text-[#60766a]`}>
                  {new Date(product.createdAt).toLocaleDateString('hy-AM')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {meta && (
        <ProductsTablePagination
          meta={meta}
          page={page}
          t={t}
          goToPage={goToPage}
          paginationWindow={paginationWindow}
          visiblePages={visiblePages}
        />
      )}
    </>
  );
}

export function ProductsTable({
  loading,
  sortedProducts,
  products,
  selectedIds,
  toggleSelect,
  toggleSelectAll,
  sortBy,
  handleHeaderSort,
  currency,
  handleDeleteProduct,
  handleDuplicateProduct,
  duplicatingProductId,
  handleTogglePublished,
  handleToggleFeatured,
  handleToggleDailyOffer,
  dailyOfferSelection,
  togglingDailyOfferProductId,
  meta,
  page,
  setPage,
}: ProductsTableProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const totalPages = meta?.totalPages ?? 1;
  const paginationWindow = useMemo(() => getPaginationWindow(page, totalPages), [page, totalPages]);
  const visiblePages = useMemo(
    () => getVisiblePages(paginationWindow.start, paginationWindow.end),
    [paginationWindow],
  );
  const goToPage = (targetPage: number) => {
    setPage(Math.min(totalPages, Math.max(1, targetPage)));
  };
  const openProductEditor = (productId: string) => {
    router.push(`/supersudo/products/add?id=${productId}`);
  };

  return (
    <Card className={loading || sortedProducts.length === 0 ? 'rounded-2xl border border-[#dfe6e0] bg-white p-6 shadow-[0_5px_14px_rgba(22,45,32,0.05)]' : 'overflow-hidden rounded-2xl border border-[#dfe6e0] bg-white p-0 shadow-[0_8px_20px_rgba(22,45,32,0.07)]'}>
      {loading ? (
        <div className="py-8 text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-b-2 border-[#1f6c4b]" />
          <p className="text-sm text-[#5b6f63]">{t('admin.products.loadingProducts')}</p>
        </div>
      ) : sortedProducts.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-[#5b6f63]">{t('admin.products.noProducts')}</p>
        </div>
      ) : (
        <ProductsTableLoadedView
          sortedProducts={sortedProducts}
          products={products}
          selectedIds={selectedIds}
          toggleSelect={toggleSelect}
          toggleSelectAll={toggleSelectAll}
          sortBy={sortBy}
          handleHeaderSort={handleHeaderSort}
          currency={currency}
          handleDeleteProduct={handleDeleteProduct}
          handleDuplicateProduct={handleDuplicateProduct}
          duplicatingProductId={duplicatingProductId}
          handleTogglePublished={handleTogglePublished}
          handleToggleFeatured={handleToggleFeatured}
          handleToggleDailyOffer={handleToggleDailyOffer}
          dailyOfferSelection={dailyOfferSelection}
          togglingDailyOfferProductId={togglingDailyOfferProductId}
          meta={meta}
          page={page}
          t={t}
          openProductEditor={openProductEditor}
          goToPage={goToPage}
          paginationWindow={paginationWindow}
          visiblePages={visiblePages}
        />
      )}
    </Card>
  );
}






