'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Suspense,
  useEffect,
  useState,
  useRef,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type Ref,
} from 'react';
import { createPortal } from 'react-dom';
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
import { useInstantSearch, type InstantSearchResultItem } from './hooks/useInstantSearch';
import { SearchDropdown } from './SearchDropdown';
import { useCartDrawer } from './cart-drawer/cart-drawer-context';
import { WishlistHeaderHeartIcon } from './icons/WishlistHeaderHeartIcon';
import { BrandLogoLink } from './BrandLogoLink';
import { HEADER_PUBLIC_ASSETS } from '@/constants/header-public-assets';
import { navigateToProductPage, prefetchProductRoute } from '@/lib/products/prefetch-product-route';
import {
  UNIVERSAL_HEADER_ACTIONS_WRAP_CLASS,
  UNIVERSAL_HEADER_BAR_CLASS,
  UNIVERSAL_HEADER_CART_BADGE_WRAP_CLASS,
  UNIVERSAL_HEADER_CART_BUTTON_CLASS,
  UNIVERSAL_HEADER_CART_ICON_WRAP_CLASS,
  UNIVERSAL_HEADER_CART_TOTAL_PILL_CLASS,
  UNIVERSAL_HEADER_DROPDOWN_Z_CLASS,
  UNIVERSAL_HEADER_LANG_SWITCHER_WRAP_CLASS,
  UNIVERSAL_HEADER_NAV_CLASS,
  UNIVERSAL_HEADER_SEARCH_FORM_CLASS,
  UNIVERSAL_HEADER_SEARCH_ICON_BTN_CLASS,
  UNIVERSAL_HEADER_SEARCH_POPUP_BACKDROP_CLASS,
  UNIVERSAL_HEADER_SEARCH_POPUP_PANEL_CLASS,
  UNIVERSAL_HEADER_SEARCH_POPUP_PANEL_Z_CLASS,
  UNIVERSAL_HEADER_SEARCH_POPUP_Z_CLASS,
  UNIVERSAL_HEADER_SEARCH_POPUP_SUBMIT_CLASS,
  UNIVERSAL_HEADER_SEARCH_SUBMIT_CLASS,
  UNIVERSAL_HEADER_SEARCH_SUBMIT_LABEL_CLASS,
  UNIVERSAL_HEADER_SPACER_HEIGHT_CLASS,
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

type UniversalHeaderSearchFormProps = {
  formClassName: string;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  searchDropdownOpen: boolean;
  setSearchDropdownOpen: (open: boolean) => void;
  searchResults: InstantSearchResultItem[];
  searchLoading: boolean;
  searchError: string | null;
  searchSelectedIndex: number;
  searchHandleKeyDown: (event: ReactKeyboardEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onResultClick: () => void;
  onCloseDropdown: () => void;
  dropdownClassName: string;
  inputRef?: Ref<HTMLInputElement>;
  submitVariant?: 'inline' | 'popup';
  t: (key: string) => string;
};

function UniversalHeaderSearchForm({
  formClassName,
  searchQuery,
  setSearchQuery,
  searchDropdownOpen,
  setSearchDropdownOpen,
  searchResults,
  searchLoading,
  searchError,
  searchSelectedIndex,
  searchHandleKeyDown,
  onSubmit,
  onResultClick,
  onCloseDropdown,
  dropdownClassName,
  inputRef,
  submitVariant = 'inline',
  t,
}: UniversalHeaderSearchFormProps) {
  const submitClassName =
    submitVariant === 'popup'
      ? UNIVERSAL_HEADER_SEARCH_POPUP_SUBMIT_CLASS
      : UNIVERSAL_HEADER_SEARCH_SUBMIT_CLASS;
  const submitLabel = t('common.buttons.search');

  return (
    <form onSubmit={onSubmit} className={formClassName}>
      <input
        ref={inputRef}
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
        className="h-full min-w-0 flex-1 bg-transparent pl-[14px] pr-2 text-base leading-6 text-[#252525] outline-none placeholder:text-[rgba(105,105,105,0.56)]"
        aria-label={t('common.ariaLabels.search')}
        aria-controls="search-results"
        aria-expanded={searchDropdownOpen && searchResults.length > 0}
        aria-autocomplete="list"
      />
      <button
        type="submit"
        className={submitClassName}
        aria-label={submitVariant === 'popup' ? submitLabel : undefined}
      >
        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center">
          <img src={HEADER_PUBLIC_ASSETS.searchIcon} alt="" className="h-6 w-6 object-contain brightness-0 invert" />
        </span>
        {submitVariant === 'inline' ? (
          <span className={UNIVERSAL_HEADER_SEARCH_SUBMIT_LABEL_CLASS}>{submitLabel}</span>
        ) : null}
      </button>
      <SearchDropdown
        results={searchResults}
        loading={searchLoading}
        error={searchError}
        isOpen={searchDropdownOpen}
        selectedIndex={searchSelectedIndex}
        query={searchQuery}
        onResultClick={onResultClick}
        onClose={onCloseDropdown}
        onSeeAllClick={onCloseDropdown}
        className={dropdownClassName}
      />
    </form>
  );
}

/** Syncs URL search query into header state; must render under Suspense. */
function UniversalHeaderSearchSync({
  setSearchQuery,
  setSearchDropdownOpen,
  setIsSearchPopupOpen,
}: {
  setSearchQuery: (value: string) => void;
  setSearchDropdownOpen: (open: boolean) => void;
  setIsSearchPopupOpen: (open: boolean) => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const searchValue = searchParams.get('search')?.trim() || '';
    setSearchQuery(searchValue);
    setSearchDropdownOpen(false);
    setIsSearchPopupOpen(false);
  }, [searchParams, setSearchQuery, setSearchDropdownOpen, setIsSearchPopupOpen]);

  return null;
}

export function UniversalHeader({ spacerBackgroundClassName = 'bg-white' }: UniversalHeaderProps) {
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSearchPopupOpen, setIsSearchPopupOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const searchPopupInputRef = useRef<HTMLInputElement>(null);
  const [searchPopupPortalTarget, setSearchPopupPortalTarget] = useState<HTMLElement | null>(null);
  const { openCartDrawer } = useCartDrawer();
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, logout } = useAuth();
  const currency = useCurrency();
  const router = useRouter();
  const pathname = usePathname();
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
    setSearchPopupPortalTarget(document.body);
  }, []);

  useEffect(() => {
    if (!isSearchPopupOpen) {
      return;
    }

    searchPopupInputRef.current?.focus();

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSearchPopupOpen(false);
        setSearchDropdownOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isSearchPopupOpen, setSearchDropdownOpen]);

  useEffect(() => {
    if (!isSearchPopupOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isSearchPopupOpen]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

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
      setIsSearchPopupOpen(false);
      clearSearch();
      return;
    }

    const query = searchQuery.trim();
    const params = new URLSearchParams();
    if (query) {
      params.set('search', query);
    }
    setSearchDropdownOpen(false);
    setIsSearchPopupOpen(false);
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

  const closeSearchDropdown = () => {
    setSearchDropdownOpen(false);
  };

  const handleSearchResultClick = () => {
    setSearchDropdownOpen(false);
    setIsSearchPopupOpen(false);
    clearSearch();
  };

  const closeSearchPopup = () => {
    setIsSearchPopupOpen(false);
    setSearchDropdownOpen(false);
  };

  const searchFormProps = {
    searchQuery,
    setSearchQuery,
    searchDropdownOpen,
    setSearchDropdownOpen,
    searchResults,
    searchLoading,
    searchError,
    searchSelectedIndex,
    searchHandleKeyDown,
    onSubmit: handleSearchSubmit,
    onResultClick: handleSearchResultClick,
    onCloseDropdown: closeSearchDropdown,
    t,
  };

  return (
    <>
      <Suspense fallback={null}>
        <UniversalHeaderSearchSync
          setSearchQuery={setSearchQuery}
          setSearchDropdownOpen={setSearchDropdownOpen}
          setIsSearchPopupOpen={setIsSearchPopupOpen}
        />
      </Suspense>
      <div aria-hidden="true" className={`${UNIVERSAL_HEADER_SPACER_HEIGHT_CLASS} ${spacerBackgroundClassName}`} />
      <header className={UNIVERSAL_HEADER_BAR_CLASS}>
        <BrandLogoLink onDark className="shrink-0" title="Degusto" />
        <nav className={UNIVERSAL_HEADER_NAV_CLASS}>
          <Link href="/" className={`shrink-0 transition-colors ${isActivePath('/') ? 'text-[#ff7f20]' : 'text-white hover:text-[#ffb07a]'}`}>{t('common.navigation.home')}</Link>
          <Link href="/shop" className={`shrink-0 transition-colors ${isActivePath('/shop') ? 'text-[#ff7f20]' : 'text-white hover:text-[#ffb07a]'}`}>{t('common.navigation.shop')}</Link>
          <Link href="/combo" className={`shrink-0 transition-colors ${isActivePath('/combo') ? 'text-[#ff7f20]' : 'text-white hover:text-[#ffb07a]'}`}>{t('common.navigation.combo')}</Link>
          <Link href="/about" className={`shrink-0 transition-colors ${isActivePath('/about') ? 'text-[#ff7f20]' : 'text-white hover:text-[#ffb07a]'}`}>{t('common.navigation.about')}</Link>
        </nav>
        <button
          type="button"
          className={UNIVERSAL_HEADER_SEARCH_ICON_BTN_CLASS}
          aria-label={t('common.ariaLabels.search')}
          onClick={() => {
            setIsProfileMenuOpen(false);
            setIsSearchPopupOpen(true);
          }}
        >
          <img src={HEADER_PUBLIC_ASSETS.searchIcon} alt="" className="h-6 w-6 object-contain brightness-0 invert" />
        </button>
        <UniversalHeaderSearchForm
          {...searchFormProps}
          formClassName={UNIVERSAL_HEADER_SEARCH_FORM_CLASS}
          dropdownClassName="left-2 right-2 mt-2 rounded-2xl"
        />
        <div className={UNIVERSAL_HEADER_ACTIONS_WRAP_CLASS}>
          <div className="hidden items-center gap-1.5 md:flex xl:gap-[7px]">
            <button
              type="button"
              onClick={() => openCartDrawer()}
              className={UNIVERSAL_HEADER_CART_BUTTON_CLASS}
              aria-label={`${t('common.navigation.cart')}, ${formatPrice(cartTotal, currency)}`}
            >
              <span data-cart-fly-target className={UNIVERSAL_HEADER_CART_ICON_WRAP_CLASS}>
                <img src={HEADER_PUBLIC_ASSETS.cartIcon} alt="" className="h-[34px] w-[37px] object-contain" />
                <span aria-hidden className={UNIVERSAL_HEADER_CART_BADGE_WRAP_CLASS}>
                  <img
                    src={HEADER_PUBLIC_ASSETS.cartCountBadge}
                    alt=""
                    className="absolute h-6 w-6 object-contain"
                  />
                  <span className="relative text-sm font-bold leading-6 text-white">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                </span>
              </span>
              <span aria-hidden className={UNIVERSAL_HEADER_CART_TOTAL_PILL_CLASS}>
                {formatPrice(cartTotal, currency)}
              </span>
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
          <div ref={profileMenuRef} className="relative shrink-0 overflow-visible">
            <button
              type="button"
              onClick={() => {
                setIsProfileMenuOpen((open) => !open);
              }}
              aria-expanded={isProfileMenuOpen}
              aria-haspopup="menu"
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/10 transition-colors hover:ring-[color:var(--project-color)]/40"
            >
              <img
                src={HEADER_PUBLIC_ASSETS.loginIcon}
                alt={isLoggedIn ? 'Profile' : 'Log in'}
                className="h-9 w-9 translate-x-0.5 -translate-y-0.5 object-contain"
              />
            </button>
            {isProfileMenuOpen ? (
            <div className={`absolute right-0 top-full ${UNIVERSAL_HEADER_DROPDOWN_Z_CLASS} min-w-[180px] pt-2`}>
              <div className="rounded-xl border border-[#e4e6eb] bg-white p-2 shadow-lg">
              {!isLoggedIn ? (
                <Link
                  href="/login"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-[#252525] transition-colors hover:bg-[#f1f2f4]"
                >
                  {t('common.navigation.login')}
                </Link>
              ) : (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-[#252525] transition-colors hover:bg-[#f1f2f4]"
                  >
                    {t('common.navigation.profile')}
                  </Link>
                  {isAdmin ? (
                    <Link
                      href="/supersudo"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-[#252525] transition-colors hover:bg-[#f1f2f4]"
                    >
                      {t('common.navigation.adminPanel')}
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      logout();
                    }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-[#252525] transition-colors hover:bg-[#f1f2f4]"
                  >
                    {t('common.navigation.logout')}
                  </button>
                </>
              )}
              </div>
            </div>
            ) : null}
          </div>
        </div>
      </header>
      {isSearchPopupOpen && searchPopupPortalTarget
        ? createPortal(
            <>
              <div
                role="presentation"
                aria-hidden="true"
                className={`${UNIVERSAL_HEADER_SEARCH_POPUP_BACKDROP_CLASS} ${UNIVERSAL_HEADER_SEARCH_POPUP_Z_CLASS} hidden lg:block xl:hidden`}
                onClick={closeSearchPopup}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-label={t('common.ariaLabels.search')}
                className={`${UNIVERSAL_HEADER_SEARCH_POPUP_PANEL_CLASS} ${UNIVERSAL_HEADER_SEARCH_POPUP_PANEL_Z_CLASS} hidden lg:block xl:hidden`}
              >
                <UniversalHeaderSearchForm
                  {...searchFormProps}
                  formClassName="relative flex h-12 w-full items-center overflow-visible rounded-[90px] bg-white p-1 ring-1 ring-[#ececec]"
                  dropdownClassName="left-0 right-0 mt-2 rounded-2xl shadow-lg"
                  inputRef={searchPopupInputRef}
                  submitVariant="popup"
                />
              </div>
            </>,
            searchPopupPortalTarget
          )
        : null}
    </>
  );
}
