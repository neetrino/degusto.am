'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { LanguageCurrencySwitcher } from './LanguageCurrencySwitcher';
import { useTranslation } from '../lib/i18n-client';
import { useAuth } from '../lib/auth/AuthContext';
import { apiClient } from '../lib/api-client';
import { getWishlistCount } from '../lib/storageCounts';
import { formatPrice } from '../lib/currency';
import { useCurrency } from './hooks/useCurrency';
import { readCartSummaryCache, writeCartSummaryCache, clearCartSummaryCache } from '../lib/cartSummaryCache';
import {
  applyCartBadgeFromDetail,
  parseCartUpdatedDetail,
  resetCartBadgeState,
} from '@/lib/cart/cart-events';
import { useInstantSearch } from './hooks/useInstantSearch';
import { SearchDropdown } from './SearchDropdown';
import { useCartDrawer } from './cart-drawer/cart-drawer-context';
import { WishlistHeaderHeartIcon } from './icons/WishlistHeaderHeartIcon';
import { BrandLogoLink } from './BrandLogoLink';
import { HEADER_PUBLIC_ASSETS } from '@/constants/header-public-assets';
import { navigateToProductPage, prefetchProductRoute } from '@/lib/products/prefetch-product-route';
import {
  UNIVERSAL_HEADER_ACTIONS_WRAP_CLASS,
  UNIVERSAL_HEADER_BAR_CLASS,
  UNIVERSAL_HEADER_CART_BUTTON_WITH_TOTAL_CLASS,
  UNIVERSAL_HEADER_CART_TOTAL_PILL_CLASS,
  UNIVERSAL_HEADER_LANG_SWITCHER_WRAP_CLASS,
  UNIVERSAL_HEADER_NAV_CLASS,
  UNIVERSAL_HEADER_SEARCH_FORM_CLASS,
  UNIVERSAL_HEADER_SEARCH_SUBMIT_CLASS,
  UNIVERSAL_HEADER_SEARCH_SUBMIT_LABEL_CLASS,
} from '@/constants/universal-header-layout';

function universalWishlistNavClassName(active: boolean): string {
  const base =
    'relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-sm transition-colors duration-150 ring-1';
  return active
    ? `${base} ring-[color:var(--project-color)] ring-2`
    : `${base} ring-black/10 hover:ring-[color:var(--project-color)]/40`;
}

interface UniversalHeaderProps {
  spacerBackgroundClassName?: string;
}

interface CartResponse {
  cart?: {
    itemsCount?: number;
    totals?: {
      total?: number;
    };
  };
}

export function UniversalHeader({ spacerBackgroundClassName = 'bg-white' }: UniversalHeaderProps) {
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const { openCartDrawer } = useCartDrawer();
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, logout } = useAuth();
  const currency = useCurrency();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const userNavHref = isLoggedIn ? '/profile' : '/login';
  const searchTargetBasePath = pathname?.startsWith('/combo') ? '/combo' : '/shop';
  const isActivePath = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    results: searchResults,
    loading: searchLoading,
    error: searchError,
    isOpen: searchDropdownOpen,
    setIsOpen: setSearchDropdownOpen,
    selectedIndex: searchSelectedIndex,
    handleKeyDown: searchHandleKeyDown,
    clearSearch,
  } = useInstantSearch({
    debounceMs: 200,
    minQueryLength: 1,
    maxResults: 6,
  });

  useEffect(() => {
    const searchValue = searchParams.get('search')?.trim() || '';
    setSearchQuery(searchValue);
    setSearchDropdownOpen(false);
  }, [searchParams, setSearchQuery, setSearchDropdownOpen]);

  useEffect(() => {
    const selected = searchResults[searchSelectedIndex];
    if (selected?.slug) {
      prefetchProductRoute(router, selected.slug);
    }
  }, [router, searchResults, searchSelectedIndex]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const selected = searchSelectedIndex >= 0 ? searchResults[searchSelectedIndex] : null;
    if (selected) {
      navigateToProductPage(router, selected.slug);
      clearSearch();
      return;
    }

    const query = searchQuery.trim();
    const params = new URLSearchParams();
    if (query) {
      params.set('search', query);
    }
    setSearchDropdownOpen(false);
    const queryString = params.toString();
    router.push(queryString ? `${searchTargetBasePath}?${queryString}` : searchTargetBasePath);
  };

  useEffect(() => {
    const cached = readCartSummaryCache();
    if (cached) {
      setCartCount(cached.itemsCount);
      setCartTotal(cached.total);
    }

    const fetchCart = async () => {
      try {
        const response = await apiClient.get<CartResponse>('/api/v1/cart');
        const itemsCount = response.cart?.itemsCount || 0;
        const total = response.cart?.totals?.total || 0;
        if (itemsCount === 0) {
          resetCartBadgeState();
          return;
        }
        setCartCount(itemsCount);
        setCartTotal(total);
        writeCartSummaryCache(itemsCount, total);
      } catch {
        resetCartBadgeState();
      }
    };

    const handleCartUpdated = (event: Event) => {
      const detail = parseCartUpdatedDetail(event);
      const result = applyCartBadgeFromDetail(detail, (itemsCount, total) => {
        setCartCount(itemsCount);
        setCartTotal(total);
        writeCartSummaryCache(itemsCount, total);
      });
      if (result === 'force-reload' || result === 'miss') {
        void fetchCart();
      }
    };

    const refreshWishlistCount = () => {
      void getWishlistCount().then(setWishlistCount);
    };

    refreshWishlistCount();

    const handleWishlistUpdated = () => {
      refreshWishlistCount();
    };

    const handleAuthForCartAndWishlist = () => {
      clearCartSummaryCache();
      refreshWishlistCount();
      void fetchCart();
    };

    void fetchCart();
    window.addEventListener('cart-updated', handleCartUpdated);
    window.addEventListener('auth-updated', handleAuthForCartAndWishlist);
    window.addEventListener('wishlist-updated', handleWishlistUpdated);

    return () => {
      window.removeEventListener('cart-updated', handleCartUpdated);
      window.removeEventListener('auth-updated', handleAuthForCartAndWishlist);
      window.removeEventListener('wishlist-updated', handleWishlistUpdated);
    };
  }, [isLoggedIn]);

  return (
    <>
      <div aria-hidden="true" className={`h-[104px] ${spacerBackgroundClassName}`} />
      <header className={UNIVERSAL_HEADER_BAR_CLASS}>
        <BrandLogoLink onDark className="shrink-0" title="Degusto" />
        <nav className={UNIVERSAL_HEADER_NAV_CLASS}>
          <Link href="/" className={`shrink-0 transition-colors ${isActivePath('/') ? 'text-[#ff7f20]' : 'text-white hover:text-[#ffb07a]'}`}>{t('common.navigation.home')}</Link>
          <Link href="/shop" className={`shrink-0 transition-colors ${isActivePath('/shop') ? 'text-[#ff7f20]' : 'text-white hover:text-[#ffb07a]'}`}>{t('common.navigation.shop')}</Link>
          <Link href="/combo" className={`shrink-0 transition-colors ${isActivePath('/combo') ? 'text-[#ff7f20]' : 'text-white hover:text-[#ffb07a]'}`}>{t('common.navigation.combo')}</Link>
          <Link href="/about" className={`shrink-0 transition-colors ${isActivePath('/about') ? 'text-[#ff7f20]' : 'text-white hover:text-[#ffb07a]'}`}>{t('common.navigation.about')}</Link>
        </nav>
        <form
          onSubmit={handleSearchSubmit}
          className={UNIVERSAL_HEADER_SEARCH_FORM_CLASS}
        >
          <input
            type="text"
            value={searchQuery}
            onFocus={() => {
              if (searchQuery.trim().length >= 1) {
                setSearchDropdownOpen(true);
              }
            }}
            onBlur={() => {
              window.setTimeout(() => setSearchDropdownOpen(false), 120);
            }}
            onChange={(event) => {
              const nextValue = event.target.value;
              setSearchQuery(nextValue);
              setSearchDropdownOpen(nextValue.trim().length >= 1);
            }}
            onKeyDown={searchHandleKeyDown}
            placeholder={t('common.placeholders.search')}
            className="h-full min-w-0 flex-1 bg-transparent pl-[14px] text-base leading-6 text-[#252525] outline-none placeholder:text-[rgba(105,105,105,0.56)]"
            aria-label={t('common.ariaLabels.search')}
            aria-controls="search-results"
            aria-expanded={searchDropdownOpen && searchResults.length > 0}
            aria-autocomplete="list"
          />
          <button type="submit" className={UNIVERSAL_HEADER_SEARCH_SUBMIT_CLASS}>
            <span className="absolute left-1/2 top-1/2 inline-flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center xl:left-0 xl:translate-x-0">
              <img src={HEADER_PUBLIC_ASSETS.searchIcon} alt="" className="h-6 w-6 object-contain brightness-0 invert" />
            </span>
            <span className={UNIVERSAL_HEADER_SEARCH_SUBMIT_LABEL_CLASS}>{t('common.buttons.search')}</span>
          </button>
          <SearchDropdown
            results={searchResults}
            loading={searchLoading}
            error={searchError}
            isOpen={searchDropdownOpen}
            selectedIndex={searchSelectedIndex}
            query={searchQuery}
            onResultClick={() => {
              setSearchDropdownOpen(false);
              clearSearch();
            }}
            onClose={() => setSearchDropdownOpen(false)}
            onSeeAllClick={() => setSearchDropdownOpen(false)}
            className="left-2 right-2 mt-2 rounded-2xl"
          />
        </form>
        <div className={UNIVERSAL_HEADER_ACTIONS_WRAP_CLASS}>
          <div className="hidden items-center gap-1.5 md:flex xl:gap-[7px]">
            <button
              type="button"
              onClick={() => openCartDrawer()}
              className={`relative inline-flex h-12 shrink-0 items-center ${
                cartCount > 0 ? UNIVERSAL_HEADER_CART_BUTTON_WITH_TOTAL_CLASS : 'w-12 justify-center'
              }`}
              aria-label={
                cartCount > 0
                  ? `${t('common.navigation.cart')}, ${formatPrice(cartTotal, currency)}`
                  : t('common.navigation.cart')
              }
            >
              {cartCount > 0 && (
                <span
                  aria-hidden
                  className={UNIVERSAL_HEADER_CART_TOTAL_PILL_CLASS}
                >
                  {formatPrice(cartTotal, currency)}
                </span>
              )}
              <span
                data-cart-fly-target
                className={`inline-flex h-[34px] w-[37px] items-center justify-center ${
                  cartCount > 0 ? 'absolute bottom-[1px] left-2' : ''
                }`}
              >
                <img src={HEADER_PUBLIC_ASSETS.cartIcon} alt="" className="h-[34px] w-[37px] object-contain" />
              </span>
              {cartCount > 0 && (
                <span
                  aria-hidden
                  className="absolute left-[35px] top-[2px] inline-flex h-6 w-6 items-center justify-center"
                >
                  <img
                    src={HEADER_PUBLIC_ASSETS.cartCountBadge}
                    alt=""
                    className="absolute h-6 w-6 object-contain"
                  />
                  <span className="relative text-sm font-bold leading-6 text-[#f66812]">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                </span>
              )}
            </button>
            <Link
              href="/wishlist"
              className={`${universalWishlistNavClassName(isActivePath('/wishlist'))} hidden md:inline-flex`}
              aria-current={isActivePath('/wishlist') ? 'page' : undefined}
              aria-label={
                wishlistCount > 0
                  ? `${t('common.navigation.wishlist')}, ${wishlistCount}`
                  : t('common.navigation.wishlist')
              }
            >
              <WishlistHeaderHeartIcon />
              {wishlistCount > 0 && (
                <span
                  aria-hidden
                  className="absolute -right-0.5 -top-0.5 inline-flex h-6 w-6 items-center justify-center"
                >
                  <span className="absolute h-6 w-6 rounded-full bg-[#f66812]" />
                  <span className="relative text-xs font-bold leading-none text-white">
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                </span>
              )}
            </Link>
          </div>
          <div className={UNIVERSAL_HEADER_LANG_SWITCHER_WRAP_CLASS}>
            <LanguageCurrencySwitcher
              variant="desktop"
              iconSrc={HEADER_PUBLIC_ASSETS.switcherIcon}
            />
          </div>
          <div className="group relative shrink-0">
            <Link
              href={userNavHref}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/10 transition-colors hover:ring-[color:var(--project-color)]/40"
            >
              <img
                src={HEADER_PUBLIC_ASSETS.loginIcon}
                alt={isLoggedIn ? 'Profile' : 'Log in'}
                className="h-9 w-9 translate-x-0.5 -translate-y-0.5 object-contain"
              />
            </Link>
            <div className="pointer-events-none absolute right-0 top-full z-50 min-w-[180px] pt-2 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
              <div className="rounded-xl border border-[#e4e6eb] bg-white p-2 shadow-lg">
              {!isLoggedIn ? (
                <Link
                  href="/login"
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-[#252525] transition-colors hover:bg-[#f1f2f4]"
                >
                  {t('common.navigation.login')}
                </Link>
              ) : (
                <>
                  <Link
                    href="/profile"
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-[#252525] transition-colors hover:bg-[#f1f2f4]"
                  >
                    {t('common.navigation.profile')}
                  </Link>
                  {isAdmin ? (
                    <Link
                      href="/supersudo"
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-[#252525] transition-colors hover:bg-[#f1f2f4]"
                    >
                      {t('common.navigation.adminPanel')}
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={logout}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-[#252525] transition-colors hover:bg-[#f1f2f4]"
                  >
                    {t('common.navigation.logout')}
                  </button>
                </>
              )}
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
