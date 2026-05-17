'use client';

import { FormEvent, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useInstantSearch } from '../hooks/useInstantSearch';
import { SearchDropdown } from '../SearchDropdown';
import { useTranslation } from '../../lib/i18n-client';
import { getStoredLanguage } from '../../lib/language';
import {
  MOBILE_FIGMA_STOREFRONT_ASSETS,
  MOBILE_STORE_MENU_SEARCH_URL_DEBOUNCE_MS,
} from '@/constants/mobile-figma-storefront';
import { MobileFriendlyInput } from '@/components/mobile/MobileFriendlyInput';

function isStoreMenuPath(pathname: string | null): boolean {
  if (!pathname) {
    return false;
  }
  return (
    pathname === '/shop' ||
    pathname.startsWith('/shop/') ||
    pathname === '/combo' ||
    pathname.startsWith('/combo/')
  );
}

function resolveMenuBasePath(pathname: string | null): '/shop' | '/combo' {
  if (pathname?.startsWith('/combo')) {
    return '/combo';
  }
  return '/shop';
}

type MobileStorefrontHeaderSearchProps = {
  onFilterClick: () => void;
};

/**
 * Figma-style search row for the shared mobile storefront header (instant search + shop URL sync).
 */
export function MobileStorefrontHeaderSearch({ onFilterClick }: MobileStorefrontHeaderSearchProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const menu = isStoreMenuPath(pathname);
  const urlSearch = searchParams.get('search') ?? '';
  const urlDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paramsSnapshotRef = useRef<string>(searchParams.toString());

  useLayoutEffect(() => {
    paramsSnapshotRef.current = searchParams.toString();
  }, [searchParams]);

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

  const replaceMenuSearch = useCallback(
    (nextSearch: string) => {
      const params = new URLSearchParams(paramsSnapshotRef.current);
      const trimmed = nextSearch.trim();
      if (trimmed) {
        params.set('search', trimmed);
      } else {
        params.delete('search');
      }
      const base = resolveMenuBasePath(pathname);
      const queryString = params.toString();
      router.replace(queryString ? `${base}?${queryString}` : base);
    },
    [pathname, router]
  );

  const scheduleMenuSearchUrlSync = useCallback(
    (nextSearch: string) => {
      if (urlDebounceRef.current) {
        clearTimeout(urlDebounceRef.current);
      }
      urlDebounceRef.current = setTimeout(() => {
        urlDebounceRef.current = null;
        replaceMenuSearch(nextSearch);
      }, MOBILE_STORE_MENU_SEARCH_URL_DEBOUNCE_MS);
    },
    [replaceMenuSearch]
  );

  const flushMenuSearchUrlSync = useCallback(
    (nextSearch: string) => {
      if (urlDebounceRef.current) {
        clearTimeout(urlDebounceRef.current);
        urlDebounceRef.current = null;
      }
      replaceMenuSearch(nextSearch);
    },
    [replaceMenuSearch]
  );

  useEffect(() => {
    return () => {
      if (urlDebounceRef.current) {
        clearTimeout(urlDebounceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!menu) {
      return;
    }
    setQuery(urlSearch);
  }, [menu, setQuery, urlSearch]);

  useEffect(() => {
    if (menu) {
      return;
    }
    clearSearch();
  }, [menu, clearSearch]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (menu) {
      flushMenuSearchUrlSync(query);
      setIsOpen(false);
      return;
    }
    const selected = selectedIndex >= 0 && results[selectedIndex];
    if (selected) {
      router.push(`/products/${selected.slug}`);
      clearSearch();
      return;
    }
    const trimmed = query.trim();
    clearSearch();
    router.push(trimmed ? `/shop?search=${encodeURIComponent(trimmed)}` : '/shop');
  };

  const onInputChange = (next: string) => {
    setQuery(next);
    if (menu) {
      scheduleMenuSearchUrlSync(next);
      return;
    }
    setIsOpen(next.trim().length >= 1);
  };

  const onInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      if (!menu && selectedIndex >= 0 && results[selectedIndex]) {
        event.preventDefault();
        const selected = results[selectedIndex];
        router.push(`/products/${selected.slug}`);
        clearSearch();
        setIsOpen(false);
        return;
      }
      if (menu) {
        event.preventDefault();
        flushMenuSearchUrlSync(query);
        setIsOpen(false);
        return;
      }
    }
    handleKeyDown(event);
  };

  return (
    <div className="relative z-[110]">
      <form
        onSubmit={handleSubmit}
        className="relative z-10 mt-[8px] h-12 translate-y-[20px] rounded-[30px] bg-white shadow-[0px_4px_4px_0px_rgba(0,0,0,0.05)]"
      >
        <img
          src={MOBILE_FIGMA_STOREFRONT_ASSETS.searchIcon}
          alt=""
          className="absolute left-[15px] top-1/2 h-[17px] w-[17px] -translate-y-1/2 object-contain"
        />
        <MobileFriendlyInput
          type="text"
          value={query}
          onChange={(event) => {
            onInputChange(event.target.value);
          }}
          onSheetOpen={() => {
            if (!menu && query.trim().length >= 1) {
              setIsOpen(true);
            }
          }}
          onSheetCommit={(nextValue) => {
            if (menu) {
              flushMenuSearchUrlSync(nextValue);
            }
          }}
          onKeyDown={onInputKeyDown}
          placeholder={t('common.buttons.search')}
          sheetTitle={t('common.buttons.search')}
          className="h-full w-full rounded-[30px] bg-transparent pl-[39px] pr-[58px] text-[15px] leading-6 text-black outline-none placeholder:text-[#abb7c2]"
          aria-controls="search-results"
          aria-expanded={!menu && isOpen && results.length > 0}
          aria-autocomplete="list"
          sheetFooter={
            !menu ? (
              <SearchDropdown
                results={results}
                loading={loading}
                error={error}
                isOpen={isOpen}
                selectedIndex={selectedIndex}
                query={query}
                onResultClick={(result) => {
                  router.push(`/products/${result.slug}`);
                  setIsOpen(false);
                  clearSearch();
                }}
                onClose={() => setIsOpen(false)}
                onSeeAllClick={() => setIsOpen(false)}
                className="relative z-[1] shadow-none"
              />
            ) : undefined
          }
        />
        <button
          type="button"
          onClick={() => {
            onFilterClick();
          }}
          className="absolute right-[7px] top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center"
          aria-label={t('products.header.filters')}
        >
          <img
            src={MOBILE_FIGMA_STOREFRONT_ASSETS.searchFilterButton}
            alt=""
            className="h-10 w-10 object-contain"
          />
        </button>
      </form>
      {!menu ? (
        <SearchDropdown
          results={results}
          loading={loading}
          error={error}
          isOpen={isOpen}
          selectedIndex={selectedIndex}
          query={query}
          onResultClick={(result) => {
            router.push(`/products/${result.slug}`);
            setIsOpen(false);
            clearSearch();
          }}
          onClose={() => setIsOpen(false)}
          onSeeAllClick={() => setIsOpen(false)}
          className="z-[120]"
        />
      ) : null}
    </div>
  );
}
