'use client';

import { FormEvent, useCallback, useEffect } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { MobileFriendlyInput } from '@/components/mobile/MobileFriendlyInput';
import { useInstantSearch } from '../hooks/useInstantSearch';
import { SearchDropdown } from '../SearchDropdown';
import { getStoredLanguage } from '../../lib/language';
import { MOBILE_FIGMA_HEADER_SEARCH_RESULTS_STACKING_CLASS } from '@/constants/mobile-figma-storefront';
import { navigateToProductPage, prefetchProductRoute } from '@/lib/products/prefetch-product-route';
import { HomeOptimizedImage } from './HomeOptimizedImage';

type MobileHomeHeaderSearchProps = {
  searchIconSrc: string;
  filterButtonSrc: string;
  filterAriaLabel: string;
  searchPlaceholder: string;
  headerSearchStackingClass: string;
};

function buildShopSearchHref(search: string, openFilters: boolean): string {
  const params = new URLSearchParams();
  const trimmed = search.trim();
  if (trimmed) {
    params.set('search', trimmed);
  }
  if (openFilters) {
    params.set('openFilters', '1');
  }
  const queryString = params.toString();
  return queryString ? `/shop?${queryString}` : '/shop';
}

export function MobileHomeHeaderSearch({
  searchIconSrc,
  filterButtonSrc,
  filterAriaLabel,
  searchPlaceholder,
  headerSearchStackingClass,
}: MobileHomeHeaderSearchProps) {
  const router = useRouter();
  const {
    query,
    setQuery,
    results,
    loading,
    error,
    isOpen,
    setIsOpen,
    selectedIndex,
    handleKeyDown,
    clearSearch,
  } = useInstantSearch({
    debounceMs: 200,
    minQueryLength: 1,
    maxResults: 6,
    lang: getStoredLanguage(),
  });

  useEffect(() => {
    const selected = results[selectedIndex];
    if (selected?.slug) {
      prefetchProductRoute(router, selected.slug);
    }
  }, [router, results, selectedIndex]);

  const navigateToShop = useCallback(
    (search: string, openFilters = false) => {
      router.push(buildShopSearchHref(search, openFilters));
    },
    [router]
  );

  const submitSearch = useCallback(() => {
    const selected = selectedIndex >= 0 && results[selectedIndex];
    if (selected) {
      navigateToProductPage(router, selected.slug);
      clearSearch();
      setIsOpen(false);
      return;
    }
    navigateToShop(query);
    clearSearch();
    setIsOpen(false);
  }, [clearSearch, navigateToShop, query, results, router, selectedIndex, setIsOpen]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitSearch();
  };

  const onInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      if (selectedIndex >= 0 && results[selectedIndex]) {
        event.preventDefault();
        submitSearch();
        return;
      }
    }
    handleKeyDown(event);
  };

  return (
    <div className={`relative ${headerSearchStackingClass}`}>
      <form
        onSubmit={handleSubmit}
        className="relative z-0 mt-[8px] h-12 translate-y-[20px] rounded-[30px] bg-white shadow-[0px_4px_4px_0px_rgba(0,0,0,0.05)]"
      >
        <HomeOptimizedImage
          src={searchIconSrc}
          alt=""
          width={17}
          height={17}
          className="absolute left-[15px] top-1/2 h-[17px] w-[17px] -translate-y-1/2 object-contain brightness-0"
          loading="eager"
        />
        <MobileFriendlyInput
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(event.target.value.trim().length >= 1);
          }}
          onFocus={() => {
            if (query.trim().length >= 1) {
              setIsOpen(true);
            }
          }}
          onKeyDown={onInputKeyDown}
          placeholder={searchPlaceholder}
          className="h-full w-full rounded-[30px] bg-transparent pl-[39px] pr-[58px] text-base leading-6 text-black outline-none placeholder:text-[#abb7c2]"
          aria-controls="home-search-results"
          aria-expanded={isOpen && results.length > 0}
          aria-autocomplete="list"
        />
        <button
          type="button"
          onClick={() => {
            navigateToShop(query, true);
            clearSearch();
            setIsOpen(false);
          }}
          className="absolute right-[7px] top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center"
          aria-label={filterAriaLabel}
        >
          <HomeOptimizedImage
            src={filterButtonSrc}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
            loading="lazy"
          />
        </button>
      </form>
      <SearchDropdown
        results={results}
        loading={loading}
        error={error}
        isOpen={isOpen}
        selectedIndex={selectedIndex}
        query={query}
        onResultClick={() => {
          setIsOpen(false);
          clearSearch();
        }}
        onClose={() => setIsOpen(false)}
        onSeeAllClick={() => {
          navigateToShop(query);
          clearSearch();
          setIsOpen(false);
        }}
        className={MOBILE_FIGMA_HEADER_SEARCH_RESULTS_STACKING_CLASS}
      />
    </div>
  );
}
