import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import {
  isStorefrontAllCategorySlug,
  STOREFRONT_ALL_CATEGORY_SLUG,
} from '@/constants/storefront-all-category-slug';

/** Debounce before writing search to the URL (server refetch); avoids one request per key. */
export const SEARCH_QUERY_URL_DEBOUNCE_MS = 250;
/** Debounce min/max price URL updates (same reason as search). */
export const PRICE_FILTER_URL_DEBOUNCE_MS = 300;

export type BuildMenuTargetPathFn = (
  categorySlug: string,
  overrides?: {
    search?: string;
    minPrice?: string;
    maxPrice?: string;
    taste?: 'leaf' | 'neutral' | 'pepper';
    page?: number;
  }
) => string;

type MenuFilterRouteSnapshot = {
  buildTargetPath: BuildMenuTargetPathFn;
  activeCategorySlug: string;
  minPrice: string;
  maxPrice: string;
  foodFilter: 'leaf' | 'neutral' | 'pepper';
};

export function useMenuSearchUrlSync(
  commitUrlChange: (href: string) => void,
  buildTargetPath: BuildMenuTargetPathFn,
  activeCategorySlug: string,
  minPrice: string,
  maxPrice: string,
  foodFilter: 'leaf' | 'neutral' | 'pepper'
) {
  const searchUrlDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const priceUrlDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuFilterRouteRef = useRef<MenuFilterRouteSnapshot>({
    buildTargetPath,
    activeCategorySlug,
    minPrice,
    maxPrice,
    foodFilter,
  });

  useLayoutEffect(() => {
    menuFilterRouteRef.current = {
      buildTargetPath,
      activeCategorySlug,
      minPrice,
      maxPrice,
      foodFilter,
    };
  }, [activeCategorySlug, buildTargetPath, foodFilter, maxPrice, minPrice]);

  useEffect(() => {
    return () => {
      if (searchUrlDebounceRef.current) {
        clearTimeout(searchUrlDebounceRef.current);
      }
      if (priceUrlDebounceRef.current) {
        clearTimeout(priceUrlDebounceRef.current);
      }
    };
  }, []);

  const scheduleSearchQueryUrlSync = useCallback((nextSearch: string) => {
    if (searchUrlDebounceRef.current) {
      clearTimeout(searchUrlDebounceRef.current);
    }
    searchUrlDebounceRef.current = setTimeout(() => {
      searchUrlDebounceRef.current = null;
      const d = menuFilterRouteRef.current;
      commitUrlChange(
        d.buildTargetPath(d.activeCategorySlug, {
          search: nextSearch,
          minPrice: d.minPrice,
          maxPrice: d.maxPrice,
          taste: d.foodFilter,
          page: 1,
        })
      );
    }, SEARCH_QUERY_URL_DEBOUNCE_MS);
  }, [commitUrlChange]);

  const flushSearchQueryUrlSync = useCallback((nextSearch: string) => {
    if (searchUrlDebounceRef.current) {
      clearTimeout(searchUrlDebounceRef.current);
      searchUrlDebounceRef.current = null;
    }
    const d = menuFilterRouteRef.current;
    commitUrlChange(
      d.buildTargetPath(d.activeCategorySlug, {
        search: nextSearch,
        minPrice: d.minPrice,
        maxPrice: d.maxPrice,
        taste: d.foodFilter,
        page: 1,
      })
    );
  }, [commitUrlChange]);

  const schedulePriceFilterUrlSync = useCallback(
    (overrides: {
      minPrice?: string;
      maxPrice?: string;
      taste?: 'leaf' | 'neutral' | 'pepper';
    }) => {
      if (priceUrlDebounceRef.current) {
        clearTimeout(priceUrlDebounceRef.current);
      }
      priceUrlDebounceRef.current = setTimeout(() => {
        priceUrlDebounceRef.current = null;
        const d = menuFilterRouteRef.current;
        commitUrlChange(
          d.buildTargetPath(d.activeCategorySlug, {
            minPrice: overrides.minPrice ?? d.minPrice,
            maxPrice: overrides.maxPrice ?? d.maxPrice,
            taste: overrides.taste ?? d.foodFilter,
            page: 1,
          })
        );
      }, PRICE_FILTER_URL_DEBOUNCE_MS);
    },
    [commitUrlChange]
  );

  return { scheduleSearchQueryUrlSync, flushSearchQueryUrlSync, schedulePriceFilterUrlSync };
}

export function useBuildMenuTargetPath(
  searchParams: ReturnType<typeof useSearchParams>,
  searchTerm: string,
  minPrice: string,
  maxPrice: string,
  foodFilter: 'leaf' | 'neutral' | 'pepper',
  routeBasePath: string,
  preferClientUrl: boolean
): BuildMenuTargetPathFn {
  return useMemo(() => {
    return (
      categorySlug: string,
      overrides?: {
        search?: string;
        minPrice?: string;
        maxPrice?: string;
        taste?: 'leaf' | 'neutral' | 'pepper';
        page?: number;
      }
    ) => {
      const params = new URLSearchParams(
        preferClientUrl && typeof window !== 'undefined'
          ? window.location.search.slice(1)
          : searchParams.toString()
      );
      const nextSearch = (overrides?.search ?? searchTerm).trim();
      const nextMinPrice = (overrides?.minPrice ?? minPrice).trim();
      const nextMaxPrice = (overrides?.maxPrice ?? maxPrice).trim();
      const nextTaste = overrides?.taste ?? foodFilter;

      if (isStorefrontAllCategorySlug(categorySlug)) {
        params.set('category', STOREFRONT_ALL_CATEGORY_SLUG);
      } else if (categorySlug) {
        params.set('category', categorySlug);
      } else {
        params.delete('category');
      }

      if (nextSearch) {
        params.set('search', nextSearch);
      } else {
        params.delete('search');
      }

      if (nextMinPrice) {
        params.set('minPrice', nextMinPrice);
      } else {
        params.delete('minPrice');
      }

      if (nextMaxPrice) {
        params.set('maxPrice', nextMaxPrice);
      } else {
        params.delete('maxPrice');
      }

      if (nextTaste !== 'neutral') {
        params.set('taste', nextTaste);
      } else {
        params.delete('taste');
      }

      const nextPage = overrides?.page;
      if (typeof nextPage === 'number' && nextPage >= 2) {
        params.set('page', String(nextPage));
      } else {
        params.delete('page');
      }

      const queryString = params.toString();
      return queryString ? `${routeBasePath}?${queryString}` : routeBasePath;
    };
  }, [preferClientUrl, searchParams, searchTerm, minPrice, maxPrice, foodFilter, routeBasePath]);
}
