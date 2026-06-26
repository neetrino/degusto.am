'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export const DEFAULT_ORDERS_SORT_BY = 'createdAt';
export const DEFAULT_ORDERS_SORT_ORDER = 'desc' as const;

export type AdminOrdersSortOrder = 'asc' | 'desc';

export type AdminOrdersUrlState = {
  page: number;
  status: string;
  paymentStatus: string;
  search: string;
  sortBy: string;
  sortOrder: AdminOrdersSortOrder;
};

const VALID_SORT_BY = new Set(['createdAt', 'total']);
const VALID_SORT_ORDER = new Set<AdminOrdersSortOrder>(['asc', 'desc']);

function parsePage(value: string | null): number {
  const parsed = Number.parseInt(value ?? '1', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function parseSortBy(value: string | null): string {
  return value && VALID_SORT_BY.has(value) ? value : DEFAULT_ORDERS_SORT_BY;
}

function parseSortOrder(value: string | null): AdminOrdersSortOrder {
  if (value && VALID_SORT_ORDER.has(value as AdminOrdersSortOrder)) {
    return value as AdminOrdersSortOrder;
  }
  return DEFAULT_ORDERS_SORT_ORDER;
}

/** Parses admin orders list query params from the URL. */
export function parseAdminOrdersUrl(searchParams: URLSearchParams): AdminOrdersUrlState {
  return {
    page: parsePage(searchParams.get('page')),
    status: searchParams.get('status') ?? '',
    paymentStatus: searchParams.get('paymentStatus') ?? '',
    search: searchParams.get('search') ?? '',
    sortBy: parseSortBy(searchParams.get('sortBy')),
    sortOrder: parseSortOrder(searchParams.get('sortOrder')),
  };
}

/** Removes page from params when filters or sort change (page 1 is the default). */
export function resetOrdersPageParam(params: URLSearchParams): void {
  params.delete('page');
}

function setSortParams(
  params: URLSearchParams,
  sortBy: string,
  sortOrder: AdminOrdersSortOrder
): void {
  if (sortBy === DEFAULT_ORDERS_SORT_BY) {
    params.delete('sortBy');
  } else {
    params.set('sortBy', sortBy);
  }

  if (sortOrder === DEFAULT_ORDERS_SORT_ORDER) {
    params.delete('sortOrder');
  } else {
    params.set('sortOrder', sortOrder);
  }
}

/**
 * URL-owned page, sort, and filter state for admin orders (desktop + mobile paths).
 * Uses router.push so browser back/forward restores list context.
 */
export function useAdminOrdersUrlState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();

  const urlState = useMemo(
    () => parseAdminOrdersUrl(new URLSearchParams(searchParamsKey)),
    [searchParamsKey]
  );

  const buildUrl = useCallback(
    (params: URLSearchParams) =>
      params.toString() ? `${pathname}?${params.toString()}` : pathname,
    [pathname]
  );

  const pushUrl = useCallback(
    (mutator: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParamsKey);
      mutator(params);
      router.push(buildUrl(params), { scroll: false });
    },
    [router, searchParamsKey, buildUrl]
  );

  const setPage = useCallback(
    (page: number | ((prev: number) => number)) => {
      pushUrl((params) => {
        const current = parsePage(params.get('page'));
        const next = typeof page === 'function' ? page(current) : page;
        if (next <= 1) {
          params.delete('page');
        } else {
          params.set('page', String(next));
        }
      });
    },
    [pushUrl]
  );

  const applySort = useCallback(
    (column: string) => {
      if (!VALID_SORT_BY.has(column)) {
        return;
      }

      pushUrl((params) => {
        const currentSortBy = parseSortBy(params.get('sortBy'));
        const currentSortOrder = parseSortOrder(params.get('sortOrder'));

        if (currentSortBy === column) {
          const nextOrder: AdminOrdersSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
          setSortParams(params, column, nextOrder);
        } else {
          setSortParams(params, column, 'desc');
        }
        resetOrdersPageParam(params);
      });
    },
    [pushUrl]
  );

  return {
    ...urlState,
    setPage,
    applySort,
    pushUrl,
    buildUrl,
  };
}
