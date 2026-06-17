'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@shop/ui';
import { useAuth } from '../../../lib/auth/AuthContext';
import { apiClient } from '../../../lib/api-client';
import { useTranslation } from '../../../lib/i18n-client';
import { getStoredCurrency, initializeCurrencyRates, type CurrencyCode } from '../../../lib/currency';
import { ProductBulkSelectionBar } from './components/ProductBulkSelectionBar';
import { ProductFilters } from './components/ProductFilters';
import { ProductsTable } from './components/ProductsTable';
import { useProductHandlers } from './hooks/useProductHandlers';
import type { Product, ProductsResponse, Category } from './types';
import { aggregateStockValues, hasSellableStock } from '@/lib/product-stock';
import { EMPTY_DAILY_OFFER_SELECTION, type DailyOfferSelection } from '@/lib/services/daily-offer/daily-offer.types';
import { logger } from "@/lib/utils/logger";

type ProductSortField = 'price' | 'createdAt' | 'title' | 'stock';

const SORT_TOGGLE_CONFIG: Record<ProductSortField, { asc: string; desc: string }> = {
  price: { asc: 'price-asc', desc: 'price-desc' },
  createdAt: { asc: 'createdAt-asc', desc: 'createdAt-desc' },
  title: { asc: 'title-asc', desc: 'title-desc' },
  stock: { asc: 'stock-asc', desc: 'stock-desc' },
};

const getNextSortValue = (field: ProductSortField, current: string): string => {
  const config = SORT_TOGGLE_CONFIG[field];
  return current === config.asc ? config.desc : config.asc;
};

export default function ProductsPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [skuSearch, setSkuSearch] = useState('');
  const [debouncedSkuSearch, setDebouncedSkuSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'inStock' | 'outOfStock'>('all');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<ProductsResponse['meta'] | null>(null);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('createdAt-desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [togglingAllFeatured, setTogglingAllFeatured] = useState(false);
  const [dailyOfferSelection, setDailyOfferSelection] = useState<DailyOfferSelection>(
    EMPTY_DAILY_OFFER_SELECTION
  );
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const productsAbortRef = useRef<AbortController | null>(null);
  const productsRequestGenerationRef = useRef(0);

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn || !isAdmin) {
        router.push('/supersudo');
        return;
      }
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

  useEffect(() => {
    return () => {
      productsAbortRef.current?.abort();
      productsAbortRef.current = null;
    };
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [search]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSkuSearch(skuSearch);
    }, 250);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [skuSearch]);

  // Initialize currency rates and listen for currency changes
  useEffect(() => {
    const updateCurrency = () => {
      const newCurrency = getStoredCurrency();
      logger.debug('💱 [ADMIN PRODUCTS] Currency updated to:', newCurrency);
      setCurrency(newCurrency);
    };
    
    // Initialize currency rates
    initializeCurrencyRates().catch(console.error);
    
    // Load currency on mount
    updateCurrency();
    
    // Listen for currency changes
    if (typeof window !== 'undefined') {
      window.addEventListener('currency-updated', updateCurrency);
      const handleCurrencyRatesUpdate = () => {
        logger.debug('💱 [ADMIN PRODUCTS] Currency rates updated, refreshing currency...');
        updateCurrency();
      };
      window.addEventListener('currency-rates-updated', handleCurrencyRatesUpdate);
      
      return () => {
        window.removeEventListener('currency-updated', updateCurrency);
        window.removeEventListener('currency-rates-updated', handleCurrencyRatesUpdate);
      };
    }
  }, []);

  // Fetch categories on mount
  useEffect(() => {
    if (isLoggedIn && isAdmin) {
      fetchCategories();
    }
  }, [isLoggedIn, isAdmin]);

  useEffect(() => {
    if (!isLoggedIn || !isAdmin) {
      return;
    }

    void apiClient
      .get<DailyOfferSelection>('/api/v1/admin/daily-offers')
      .then(setDailyOfferSelection)
      .catch((error: unknown) => {
        console.error('❌ [ADMIN] Error loading daily offer selection:', error);
      });
  }, [isLoggedIn, isAdmin]);

  // Close category dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (categoriesExpanded && !target.closest('[data-category-dropdown]')) {
        setCategoriesExpanded(false);
      }
    };

    if (categoriesExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [categoriesExpanded]);

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      logger.debug('📂 [ADMIN] Fetching categories...');
      const response = await apiClient.get<{ data: Category[] }>('/api/v1/admin/categories');
      setCategories(response.data || []);
      logger.debug('✅ [ADMIN] Categories loaded:', response.data?.length || 0);
    } catch (err: any) {
      console.error('❌ [ADMIN] Error fetching categories:', err);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  /** Only `createdAt-*` is applied on the server; other sorts are client-only (avoids refetch on every header click). */
  const sortParamForApi = sortBy.startsWith('createdAt') ? sortBy : '';
  const categoryFilterKey = [...selectedCategories].sort().join(',');

  useEffect(() => {
    if (isLoggedIn && isAdmin) {
      void fetchProducts();
    }
  }, [
    isLoggedIn,
    isAdmin,
    page,
    debouncedSearch,
    categoryFilterKey,
    debouncedSkuSearch,
    stockFilter,
    sortParamForApi,
    minPrice,
    maxPrice,
  ]);

  const fetchProducts = async () => {
    let requestGeneration = 0;
    try {
      setLoading(true);
      const params: Record<string, string> = {
        page: page.toString(),
        limit: '20',
      };
      
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }

      if (selectedCategories.size > 0) {
        params.category = Array.from(selectedCategories).join(',');
      }

      if (debouncedSkuSearch.trim()) {
        params.sku = debouncedSkuSearch.trim();
      }

      if (minPrice.trim()) {
        params.minPrice = minPrice.trim();
      }

      if (maxPrice.trim()) {
        params.maxPrice = maxPrice.trim();
      }

      if (sortBy && sortBy.startsWith('createdAt')) {
        params.sort = sortBy;
      }

      productsAbortRef.current?.abort();
      requestGeneration = ++productsRequestGenerationRef.current;
      const abortController = new AbortController();
      productsAbortRef.current = abortController;

      const response = await apiClient.get<ProductsResponse>('/api/v1/admin/products', {
        params,
        signal: abortController.signal,
      });

      if (requestGeneration !== productsRequestGenerationRef.current) {
        return;
      }
      
      let filteredProducts = response.data || [];

      // Stock filter (client-side)
      if (stockFilter !== 'all') {
        filteredProducts = filteredProducts.filter(product => {
          const getTotalStock = (p: Product) => {
            if (p.colorStocks && p.colorStocks.length > 0) {
              return aggregateStockValues(p.colorStocks.map((cs) => cs.stock || 0));
            }
            return p.stock ?? 0;
          };
          const totalStock = getTotalStock(product);
          if (stockFilter === 'inStock') {
            return hasSellableStock(totalStock);
          } else if (stockFilter === 'outOfStock') {
            return !hasSellableStock(totalStock);
          }
          return true;
        });
      }

      setProducts(filteredProducts);
      setMeta(response.meta || null);
    } catch (err: unknown) {
      const isAbortError =
        err instanceof DOMException
          ? err.name === 'AbortError'
          : err instanceof Error && err.name === 'AbortError';
      if (isAbortError) {
        return;
      }
      const errorMessage =
        err instanceof Error ? err.message : t('admin.common.unknownErrorFallback');
      console.error('❌ [ADMIN] Error fetching products:', err);
      alert(t('admin.products.errorLoading').replace('{message}', errorMessage));
    } finally {
      if (
        requestGeneration === 0 ||
        requestGeneration === productsRequestGenerationRef.current
      ) {
        setLoading(false);
      }
    }
  };

  // Client-side sorting for Product / Price / Stock columns
  const sortedProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];

    if (!sortBy || sortBy.startsWith('createdAt')) {
      return products;
    }

    const [field, directionRaw] = sortBy.split('-');
    const direction = directionRaw === 'asc' ? 1 : -1;

    logger.debug('📊 [ADMIN] Applying client-side sort:', { field, direction: directionRaw });

    const cloned = [...products];

    if (field === 'price') {
      cloned.sort((a, b) => {
        const aPrice = a.price ?? 0;
        const bPrice = b.price ?? 0;
        if (aPrice === bPrice) return 0;
        return aPrice > bPrice ? direction : -direction;
      });
    } else if (field === 'title') {
      cloned.sort((a, b) => {
        const aTitle = (a.title || '').toLowerCase();
        const bTitle = (b.title || '').toLowerCase();
        if (aTitle === bTitle) return 0;
        return aTitle > bTitle ? direction : -direction;
      });
    } else if (field === 'stock') {
      cloned.sort((a, b) => {
        const getTotalStock = (product: Product) => {
          if (product.colorStocks && product.colorStocks.length > 0) {
            return aggregateStockValues(product.colorStocks.map((cs) => cs.stock || 0));
          }
          return product.stock ?? 0;
        };
        const aStock = getTotalStock(a);
        const bStock = getTotalStock(b);
        if (aStock === bStock) return 0;
        return aStock > bStock ? direction : -direction;
      });
    }

    return cloned;
  }, [products, sortBy]);

  const summary = useMemo(() => {
    const safeProducts = sortedProducts ?? [];
    const publishedCount = safeProducts.filter((product) => product.published).length;
    const featuredCount = safeProducts.filter((product) => product.featured).length;
    const outOfStockCount = safeProducts.filter((product) => {
      if (product.colorStocks && product.colorStocks.length > 0) {
        const total = aggregateStockValues(product.colorStocks.map((cs) => cs.stock || 0));
        return !hasSellableStock(total);
      }
      return !hasSellableStock(product.stock ?? 0);
    }).length;
    return {
      total: meta?.total ?? safeProducts.length,
      publishedCount,
      featuredCount,
      outOfStockCount,
    };
  }, [meta?.total, sortedProducts]);

  const handleHeaderSort = (field: ProductSortField) => {
    setPage(1);

    setSortBy((current) => {
      const next = getNextSortValue(field, current);
      logger.debug('📊 [ADMIN] Sort changed from', current, 'to', next, 'by header click');
      return next;
    });
  };

  const handlers = useProductHandlers({
    products,
    setProducts,
    fetchProducts,
    selectedIds,
    setSelectedIds,
    setPage,
    setBulkDeleting,
    setTogglingAllFeatured,
    setDailyOfferSelection,
  });

  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategories(new Set());
    setSkuSearch('');
    setStockFilter('all');
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900" />
          <p className="text-gray-600">{t('admin.common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) {
    return null;
  }

  const totalProductsCount = meta?.total ?? products.length;

  return (
    <div className="relative overflow-hidden rounded-[26px] border border-[#dde4de] bg-[#f7faf7] p-5 shadow-[0_12px_34px_rgba(31,54,41,0.08)] sm:p-6">
      <div className="pointer-events-none absolute -top-16 -right-12 z-0 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(41,123,85,0.14)_0%,rgba(41,123,85,0)_70%)]" />
      <div className="relative z-10 mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-[2rem] font-semibold leading-none text-[#1d392b]">{t('admin.products.title')}</h1>
          <span className="rounded-full bg-[#e2f1e7] px-3 py-1 text-sm font-semibold text-[#2f8a57]">{summary.total}</span>
        </div>
      </div>

      {(search || selectedCategories.size > 0 || skuSearch || stockFilter !== 'all') && (
        <div className="mb-6 flex justify-end">
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-sm text-[#1f5f44] underline hover:text-[#d7590e]"
          >
            {t('admin.products.clearAll')}
          </button>
        </div>
      )}
      <ProductFilters
        search={search}
        setSearch={setSearch}
        skuSearch={skuSearch}
        setSkuSearch={setSkuSearch}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        categories={categories}
        categoriesLoading={categoriesLoading}
        categoriesExpanded={categoriesExpanded}
        setCategoriesExpanded={setCategoriesExpanded}
        stockFilter={stockFilter}
        setStockFilter={setStockFilter}
        minPrice={minPrice}
        setMinPrice={setMinPrice}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        handleSearch={handlers.handleSearch}
        setPage={setPage}
      />

      <div className="relative z-10 mb-6">
        <Button
          type="button"
          onClick={() => router.push('/supersudo/products/add')}
          className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl border border-[#e2a16f] bg-gradient-to-r from-[#64b062] via-[#7db654] to-[#ef8a28] px-5 py-4 text-lg font-semibold text-white shadow-[0_10px_22px_rgba(70,133,55,0.28)] transition-transform hover:-translate-y-0.5"
        >
          <span className="absolute inset-y-0 left-4 flex items-center text-white/45">✦</span>
          <span className="absolute inset-y-0 right-4 flex items-center text-white/45">✦</span>
          <span className="grid h-9 w-9 place-items-center rounded-full border border-white/60 bg-black/15 text-2xl leading-none">+</span>
          {t('admin.products.addNewProduct')}
        </Button>
      </div>

      {selectedIds.size > 0 ? (
        <div className="relative z-10">
          <ProductBulkSelectionBar
            selectedCount={selectedIds.size}
            onBulkDelete={handlers.handleBulkDelete}
            bulkDeleting={bulkDeleting}
          />
        </div>
      ) : null}

      <div className="relative z-10">
        <ProductsTable
          loading={loading}
          sortedProducts={sortedProducts}
          products={products}
          selectedIds={selectedIds}
          toggleSelect={handlers.toggleSelect}
          toggleSelectAll={handlers.toggleSelectAll}
          sortBy={sortBy}
          handleHeaderSort={handleHeaderSort}
          currency={currency}
          handleDeleteProduct={handlers.handleDeleteProduct}
          handleDuplicateProduct={handlers.handleDuplicateProduct}
          duplicatingProductId={handlers.duplicatingProductId}
          handleTogglePublished={handlers.handleTogglePublished}
          handleToggleFeatured={handlers.handleToggleFeatured}
          handleToggleDailyOffer={handlers.handleToggleDailyOffer}
          dailyOfferSelection={dailyOfferSelection}
          togglingDailyOfferProductId={handlers.togglingDailyOfferProductId}
          meta={meta}
          page={page}
          setPage={setPage}
        />
      </div>
    </div>
  );
}
