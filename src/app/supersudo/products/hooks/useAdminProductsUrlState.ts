'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export type AdminProductsStockFilter = 'all' | 'inStock' | 'outOfStock';

export const ADMIN_PRODUCTS_BASE_PATH = '/supersudo/products';
const SEARCH_DEBOUNCE_MS = 400;
const DEFAULT_SORT = 'createdAt-desc';

export type AdminProductsUrlState = {
  page: number;
  search: string;
  sku: string;
  selectedCategories: Set<string>;
  stockFilter: AdminProductsStockFilter;
  minPrice: string;
  maxPrice: string;
  sortBy: string;
};

function parseStockFilter(value: string | null): AdminProductsStockFilter {
  if (value === 'inStock' || value === 'outOfStock') {
    return value;
  }
  return 'all';
}

export function parseAdminProductsUrl(searchParams: URLSearchParams): AdminProductsUrlState {
  const pageRaw = searchParams.get('page');
  const parsedPage = Number.parseInt(pageRaw ?? '1', 10);

  return {
    page: Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1,
    search: searchParams.get('search') ?? '',
    sku: searchParams.get('sku') ?? '',
    selectedCategories: new Set(
      (searchParams.get('category') ?? '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
    ),
    stockFilter: parseStockFilter(searchParams.get('stock')),
    minPrice: searchParams.get('minPrice') ?? '',
    maxPrice: searchParams.get('maxPrice') ?? '',
    sortBy: searchParams.get('sort') ?? DEFAULT_SORT,
  };
}

function buildProductsListUrl(params: URLSearchParams): string {
  return params.toString() ? `${ADMIN_PRODUCTS_BASE_PATH}?${params.toString()}` : ADMIN_PRODUCTS_BASE_PATH;
}

function resetPageParam(params: URLSearchParams): void {
  params.delete('page');
}

export function useAdminProductsUrlState() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();

  const urlState = useMemo(
    () => parseAdminProductsUrl(new URLSearchParams(searchParamsKey)),
    [searchParamsKey]
  );

  const [searchDraft, setSearchDraft] = useState(urlState.search);
  const [skuDraft, setSkuDraft] = useState(urlState.sku);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skuDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearchDraft(urlState.search);
  }, [urlState.search]);

  useEffect(() => {
    setSkuDraft(urlState.sku);
  }, [urlState.sku]);

  const replaceUrl = useCallback(
    (mutator: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParamsKey);
      mutator(params);
      router.replace(buildProductsListUrl(params), { scroll: false });
    },
    [router, searchParamsKey]
  );

  const applySearchToUrl = useCallback(
    (nextSearch: string, options?: { resetPage?: boolean }) => {
      replaceUrl((params) => {
        const trimmed = nextSearch.trim();
        if (trimmed) {
          params.set('search', trimmed);
        } else {
          params.delete('search');
        }
        if (options?.resetPage !== false) {
          resetPageParam(params);
        }
      });
    },
    [replaceUrl]
  );

  const applySkuToUrl = useCallback(
    (nextSku: string, options?: { resetPage?: boolean }) => {
      replaceUrl((params) => {
        const trimmed = nextSku.trim();
        if (trimmed) {
          params.set('sku', trimmed);
        } else {
          params.delete('sku');
        }
        if (options?.resetPage !== false) {
          resetPageParam(params);
        }
      });
    },
    [replaceUrl]
  );

  useEffect(() => {
    if (searchDraft.trim() === urlState.search) {
      return;
    }

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      searchDebounceRef.current = null;
      applySearchToUrl(searchDraft);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [applySearchToUrl, searchDraft, urlState.search]);

  useEffect(() => {
    if (skuDraft.trim() === urlState.sku) {
      return;
    }

    if (skuDebounceRef.current) {
      clearTimeout(skuDebounceRef.current);
    }

    skuDebounceRef.current = setTimeout(() => {
      skuDebounceRef.current = null;
      applySkuToUrl(skuDraft);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (skuDebounceRef.current) {
        clearTimeout(skuDebounceRef.current);
      }
    };
  }, [applySkuToUrl, skuDraft, urlState.sku]);

  const commitSearchToUrl = useCallback(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
    applySearchToUrl(searchDraft);
  }, [applySearchToUrl, searchDraft]);

  const setPage = useCallback(
    (page: number | ((prev: number) => number)) => {
      replaceUrl((params) => {
        const current = Number.parseInt(params.get('page') ?? '1', 10) || 1;
        const next = typeof page === 'function' ? page(current) : page;
        if (next <= 1) {
          params.delete('page');
        } else {
          params.set('page', String(next));
        }
      });
    },
    [replaceUrl]
  );

  const setSortBy = useCallback(
    (sortBy: string) => {
      replaceUrl((params) => {
        if (!sortBy || sortBy === DEFAULT_SORT) {
          params.delete('sort');
        } else {
          params.set('sort', sortBy);
        }
        resetPageParam(params);
      });
    },
    [replaceUrl]
  );

  const setSelectedCategories = useCallback(
    (value: Set<string> | ((prev: Set<string>) => Set<string>)) => {
      replaceUrl((params) => {
        const next = typeof value === 'function' ? value(urlState.selectedCategories) : value;
        const joined = [...next].sort().join(',');
        if (joined) {
          params.set('category', joined);
        } else {
          params.delete('category');
        }
        resetPageParam(params);
      });
    },
    [replaceUrl, urlState.selectedCategories]
  );

  const setStockFilter = useCallback(
    (stockFilter: AdminProductsStockFilter) => {
      replaceUrl((params) => {
        if (stockFilter === 'all') {
          params.delete('stock');
        } else {
          params.set('stock', stockFilter);
        }
        resetPageParam(params);
      });
    },
    [replaceUrl]
  );

  const clearFilters = useCallback(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
    if (skuDebounceRef.current) {
      clearTimeout(skuDebounceRef.current);
      skuDebounceRef.current = null;
    }
    setSearchDraft('');
    setSkuDraft('');
    router.replace(ADMIN_PRODUCTS_BASE_PATH, { scroll: false });
  }, [router]);

  return {
    ...urlState,
    searchDraft,
    setSearchDraft,
    skuDraft,
    setSkuDraft,
    commitSearchToUrl,
    setPage,
    setSortBy,
    setSelectedCategories,
    setStockFilter,
    clearFilters,
  };
}
