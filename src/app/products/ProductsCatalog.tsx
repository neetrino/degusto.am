import Link from 'next/link';
import { Suspense } from 'react';
import { unstable_cache } from 'next/cache';
import { Button } from '@shop/ui';
import { getStoredLanguage } from '../../lib/language';
import { t } from '../../lib/i18n';
import { PriceFilter } from '../../components/PriceFilter';
import { ColorFilter } from '../../components/ColorFilter';
import { SizeFilter } from '../../components/SizeFilter';
import { ProductsHeader } from '../../components/ProductsHeader';
import { ProductsGrid } from '../../components/ProductsGrid';
import { MobileFiltersDrawer } from '../../components/MobileFiltersDrawer';
import { ProductsFiltersProvider } from '../../components/ProductsFiltersProvider';
import { MOBILE_FILTERS_EVENT } from '../../lib/events';
import { logger } from '../../lib/utils/logger';
import { productsService } from '../../lib/services/products.service';
import { getCompactPaginationPages } from '../../lib/utils/compact-pagination-pages';
import {
  STOREFRONT_DESKTOP_MAIN_COLUMN_CLASS,
  STOREFRONT_DESKTOP_SIDEBAR_GAP_CLASS,
  STOREFRONT_PAGE_CONTAINER_CLASS,
} from '@/constants/storefront-desktop-layout';

const PAGE_CONTAINER = STOREFRONT_PAGE_CONTAINER_CLASS;

interface Product {
  id: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  image: string | null;
  inStock: boolean;
  defaultVariantId?: string | null;
  colors?: unknown[];
  labels?: Array<{
    id: string;
    type: 'text' | 'percentage';
    value: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    color: string | null;
  }>;
  originalPrice?: number | null;
}

interface ProductsResponse {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const PRODUCTS_LIST_REVALIDATE_SECONDS = 60;

const getProductsCached = unstable_cache(
  async (
    page: number,
    limit: number,
    lang: string,
    search?: string,
    category?: string,
    minPrice?: number,
    maxPrice?: number,
    colors?: string,
    sizes?: string,
    sort?: string
  ): Promise<ProductsResponse> =>
    productsService.findAll({
      page,
      limit,
      lang,
      search,
      category,
      minPrice,
      maxPrice,
      colors,
      sizes,
      sort,
    }) as Promise<ProductsResponse>,
  ['products-catalog-db-v1'],
  { revalidate: PRODUCTS_LIST_REVALIDATE_SECONDS }
);

function parseOptionalPrice(value?: string): number | undefined {
  if (!value?.trim()) {
    return undefined;
  }
  const parsed = Number.parseFloat(value.trim());
  return Number.isFinite(parsed) ? parsed : undefined;
}

async function getProducts(
  page: number = 1,
  search?: string,
  category?: string,
  minPrice?: string,
  maxPrice?: string,
  colors?: string,
  sizes?: string,
  sort?: string,
  limit: number = 12
): Promise<ProductsResponse> {
  try {
    const language = getStoredLanguage();
    const response = await getProductsCached(
      page,
      limit,
      language,
      search?.trim() || undefined,
      category?.trim() || undefined,
      parseOptionalPrice(minPrice),
      parseOptionalPrice(maxPrice),
      colors?.trim() || undefined,
      sizes?.trim() || undefined,
      sort?.trim() || undefined
    );
    if (!Array.isArray(response.data)) {
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 12, totalPages: 0 },
      };
    }

    return response;
  } catch (e) {
    logger.error('Product catalog fetch failed', e);
    return {
      data: [],
      meta: { total: 0, page: 1, limit: 12, totalPages: 0 },
    };
  }
}

type SearchParamsInput = Record<string, string | string[] | undefined>;

export async function ProductsCatalog({
  searchParams,
}: {
  searchParams: Promise<SearchParamsInput> | SearchParamsInput;
}) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const page = parseInt((params.page as string) || '1', 10);
  const limitParam = typeof params.limit === 'string' ? params.limit.trim() : '';
  const parsedLimit = limitParam && !Number.isNaN(parseInt(limitParam, 10))
    ? parseInt(limitParam, 10)
    : null;
  const perPage = parsedLimit ? Math.min(parsedLimit, 200) : 12;

  const productsData = await getProducts(
    page,
    typeof params.search === 'string' ? params.search : undefined,
    typeof params.category === 'string' ? params.category : undefined,
    typeof params.minPrice === 'string' ? params.minPrice : undefined,
    typeof params.maxPrice === 'string' ? params.maxPrice : undefined,
    typeof params.colors === 'string' ? params.colors : undefined,
    typeof params.sizes === 'string' ? params.sizes : undefined,
    typeof params.sort === 'string' ? params.sort : undefined,
    perPage
  );

  const normalizedProducts = productsData.data.map((p: Product) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? p.originalPrice ?? null,
    image: p.image ?? null,
    inStock: p.inStock ?? true,
    defaultVariantId: p.defaultVariantId ?? null,
    colors: Array.isArray(p.colors) ? p.colors : [],
    labels: p.labels ?? [],
  }));

  const colors = typeof params.colors === 'string' ? params.colors : undefined;
  const sizes = typeof params.sizes === 'string' ? params.sizes : undefined;
  const selectedColors = colors ? colors.split(',').map((c: string) => c.trim().toLowerCase()) : [];
  const selectedSizes = sizes ? sizes.split(',').map((s: string) => s.trim()) : [];

  const buildPaginationUrl = (num: number) => {
    const q = new URLSearchParams();
    q.set('page', num.toString());
    const currentLimit = params.limit ? String(params.limit) : '12';
    q.set('limit', currentLimit);
    Object.entries(params).forEach(([k, v]) => {
      if (k !== 'page' && k !== 'limit' && v && typeof v === 'string') q.set(k, v);
    });
    return `/shop?${q.toString()}`;
  };

  const language = getStoredLanguage();
  const sortParam = typeof params.sort === 'string' ? params.sort : 'newest';

  return (
    <>
      <div className={PAGE_CONTAINER}>
        <ProductsHeader total={productsData.meta.total} perPage={productsData.meta.limit} />
      </div>

      <div className={`${STOREFRONT_PAGE_CONTAINER_CLASS} flex min-w-0 flex-col lg:flex-row ${STOREFRONT_DESKTOP_SIDEBAR_GAP_CLASS}`}>
        <ProductsFiltersProvider
          category={typeof params.category === 'string' ? params.category : undefined}
          search={typeof params.search === 'string' ? params.search : undefined}
          minPrice={typeof params.minPrice === 'string' ? params.minPrice : undefined}
          maxPrice={typeof params.maxPrice === 'string' ? params.maxPrice : undefined}
        >
          <aside className="hidden w-64 shrink-0 self-start rounded-xl bg-gray-50 lg:sticky lg:top-24 lg:z-10 lg:block">
            <div className="p-4 space-y-6 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto">
              <Suspense fallback={<div>{t(language, 'common.messages.loadingFilters')}</div>}>
                <PriceFilter
                  currentMinPrice={typeof params.minPrice === 'string' ? params.minPrice : undefined}
                  currentMaxPrice={typeof params.maxPrice === 'string' ? params.maxPrice : undefined}
                  category={typeof params.category === 'string' ? params.category : undefined}
                  search={typeof params.search === 'string' ? params.search : undefined}
                />
                <ColorFilter
                  category={typeof params.category === 'string' ? params.category : undefined}
                  search={typeof params.search === 'string' ? params.search : undefined}
                  minPrice={typeof params.minPrice === 'string' ? params.minPrice : undefined}
                  maxPrice={typeof params.maxPrice === 'string' ? params.maxPrice : undefined}
                  selectedColors={selectedColors}
                />
                <SizeFilter
                  category={typeof params.category === 'string' ? params.category : undefined}
                  search={typeof params.search === 'string' ? params.search : undefined}
                  minPrice={typeof params.minPrice === 'string' ? params.minPrice : undefined}
                  maxPrice={typeof params.maxPrice === 'string' ? params.maxPrice : undefined}
                  selectedSizes={selectedSizes}
                />
              </Suspense>
            </div>
          </aside>

          <div className={`${STOREFRONT_DESKTOP_MAIN_COLUMN_CLASS} w-full py-4 lg:w-auto`}>
            {normalizedProducts.length > 0 ? (
              <>
                <ProductsGrid products={normalizedProducts} sortBy={sortParam} />

                {productsData.meta.totalPages > 1 && (
                  <nav
                    className="mt-10 flex flex-wrap items-center justify-center gap-2"
                    aria-label="Pagination"
                  >
                    {page > 1 ? (
                      <Link href={buildPaginationUrl(page - 1)}>
                        <Button
                          variant="outline"
                          className="min-w-[90px] rounded-lg border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition hover:border-neutral-400 hover:bg-neutral-50"
                        >
                          {t(language, 'common.pagination.previous')}
                        </Button>
                      </Link>
                    ) : (
                      <span className="min-w-[90px] rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2 text-center text-sm font-medium text-neutral-400">
                        {t(language, 'common.pagination.previous')}
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      {getCompactPaginationPages(productsData.meta.totalPages, page).map((item, idx) =>
                        item === 'ellipsis' ? (
                          <span key={`ellipsis-${idx}`} className="px-2 text-neutral-400" aria-hidden>
                            …
                          </span>
                        ) : (
                          <span key={item}>
                            {item === page ? (
                              <span
                                className="flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg bg-neutral-800 px-3 py-1.5 text-sm font-semibold text-white shadow-sm"
                                aria-current="page"
                              >
                                {item}
                              </span>
                            ) : (
                              <Link
                                href={buildPaginationUrl(item)}
                                className="flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 shadow-sm transition hover:border-neutral-400 hover:bg-neutral-50"
                              >
                                {item}
                              </Link>
                            )}
                          </span>
                        )
                      )}
                    </div>

                    {page < productsData.meta.totalPages ? (
                      <Link href={buildPaginationUrl(page + 1)}>
                        <Button
                          variant="outline"
                          className="min-w-[90px] rounded-lg border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition hover:border-neutral-400 hover:bg-neutral-50"
                        >
                          {t(language, 'common.pagination.next')}
                        </Button>
                      </Link>
                    ) : (
                      <span className="min-w-[90px] rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2 text-center text-sm font-medium text-neutral-400">
                        {t(language, 'common.pagination.next')}
                      </span>
                    )}
                  </nav>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">{t(language, 'common.messages.noProductsFound')}</p>
              </div>
            )}
          </div>

          <MobileFiltersDrawer openEventName={MOBILE_FILTERS_EVENT}>
            <div className="p-4 space-y-6">
              <Suspense fallback={<div>{t(language, 'common.messages.loadingFilters')}</div>}>
                <PriceFilter
                  currentMinPrice={typeof params.minPrice === 'string' ? params.minPrice : undefined}
                  currentMaxPrice={typeof params.maxPrice === 'string' ? params.maxPrice : undefined}
                  category={typeof params.category === 'string' ? params.category : undefined}
                  search={typeof params.search === 'string' ? params.search : undefined}
                />
                <ColorFilter
                  category={typeof params.category === 'string' ? params.category : undefined}
                  search={typeof params.search === 'string' ? params.search : undefined}
                  minPrice={typeof params.minPrice === 'string' ? params.minPrice : undefined}
                  maxPrice={typeof params.maxPrice === 'string' ? params.maxPrice : undefined}
                  selectedColors={selectedColors}
                />
                <SizeFilter
                  category={typeof params.category === 'string' ? params.category : undefined}
                  search={typeof params.search === 'string' ? params.search : undefined}
                  minPrice={typeof params.minPrice === 'string' ? params.minPrice : undefined}
                  maxPrice={typeof params.maxPrice === 'string' ? params.maxPrice : undefined}
                  selectedSizes={selectedSizes}
                />
              </Suspense>
            </div>
          </MobileFiltersDrawer>
        </ProductsFiltersProvider>
      </div>
    </>
  );
}
