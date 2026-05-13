'use client';

import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useEffect, useLayoutEffect, useRef, Suspense } from 'react';
import type { FormEvent, ReactNode, MouseEvent as ReactMouseEvent } from 'react';
import { getStoredCurrency, setStoredCurrency, type CurrencyCode, CURRENCIES, formatPrice, initializeCurrencyRates, clearCurrencyRatesCache } from '../lib/currency';
import { useTranslation } from '../lib/i18n-client';
import { getStoredLanguage } from '../lib/language';
import { useInstantSearch } from './hooks/useInstantSearch';
import { useHeaderScrollVisibility } from './hooks/useHeaderScrollVisibility';
import {
  CART_FLY_ANIMATION_DURATION_MS,
  HEADER_REVEAL_FOR_CART_EVENT,
} from '../lib/cart-fly-animation';
import { SearchDropdown } from './SearchDropdown';
import { useAuth } from '../lib/auth/AuthContext';
import { apiClient } from '../lib/api-client';
import { CART_KEY, getCompareCount, getWishlistCount } from '../lib/storageCounts';
import { LanguageSwitcherHeader } from './LanguageSwitcherHeader';
import { Instagram, Facebook, Linkedin, Globe } from 'lucide-react';
import { CompareIcon } from './icons/CompareIcon';
import { BrandLogoLink } from './BrandLogoLink';
import { CartIcon } from './icons/CartIcon';
import { readCartSummaryCache, writeCartSummaryCache } from '../lib/cartSummaryCache';

// Navigation links will be translated dynamically using useTranslation hook
const primaryNavLinks = [
  { href: '/', translationKey: 'common.navigation.home' },
  { href: '/shop', translationKey: 'common.navigation.shop' },
  { href: '/shop', translationKey: 'common.navigation.combo' },
  { href: '/about', translationKey: 'common.navigation.about' },
];

/** Same transform timing as top bar so the nav lifts in lockstep while the strip hides. */
const HEADER_TOPBAR_SCROLL_TRANSITION_CLASS =
  'transition-transform duration-300 ease-out will-change-transform';

function isHeaderNavActive(pathname: string | null, href: string): boolean {
  if (!pathname) {
    return false;
  }
  if (href === '/') {
    return pathname === '/';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

const HEADER_NAV_LINK_BASE =
  'px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium whitespace-nowrap';

const HEADER_FAST_NAV_ROUTES = ['/', '/shop', '/about', '/wishlist', '/compare', '/cart'] as const;

function headerTextNavClassName(active: boolean): string {
  return active
    ? `${HEADER_NAV_LINK_BASE} bg-gray-100 text-gray-900 font-semibold ring-1 ring-gray-200/90`
    : `${HEADER_NAV_LINK_BASE} text-gray-700 hover:text-gray-900 hover:bg-gray-50`;
}

function headerIconNavClassName(active: boolean): string {
  const base =
    'w-11 h-11 flex items-center justify-center transition-colors duration-150 rounded-lg';
  return active
    ? `${base} text-gray-900 bg-gray-100 ring-1 ring-gray-200/90`
    : `${base} text-gray-700 hover:text-gray-900`;
}

function headerMobileRowClassName(active: boolean): string {
  const base = 'flex items-center justify-between px-4 py-3 hover:bg-gray-50';
  return active ? `${base} bg-gray-100 text-gray-900` : base;
}

interface Category {
  id: string;
  slug: string;
  title: string;
  fullPath: string;
  children: Category[];
}

interface CategoriesResponse {
  data: Category[];
}

// Icon Components
const ChevronDownIcon = () => (
  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Profile icon for logged out state (outline style)
 */
const ProfileIconOutline = () => (
  <svg width="19" height="19" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="7" r="3.2" stroke="currentColor" strokeWidth="1.8" fill="none" />
    <path d="M5 17C5 14.5 7.5 12.5 10 12.5C12.5 12.5 15 14.5 15 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

/**
 * Profile icon for logged in state (filled style with background)
 */
const ProfileIconFilled = () => (
  <div className="relative w-[19px] h-[19px] flex items-center justify-center">
    {/* Background circle */}
    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full opacity-90 group-hover:opacity-100 transition-opacity duration-200 shadow-md"></div>
    {/* Filled icon */}
    <svg 
      width="19" 
      height="19" 
      viewBox="0 0 20 20" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="relative z-10"
    >
      <circle cx="10" cy="7" r="3.2" fill="white" />
      <path d="M5 17C5 14.5 7.5 12.5 10 12.5C12.5 12.5 15 14.5 15 17" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  </div>
);

const WishlistIcon = () => (
  <svg width="19" height="19" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 17L8.55 15.7C4.4 12.2 2 10.1 2 7.5C2 5.4 3.4 4 5.5 4C6.8 4 8.1 4.6 9 5.5C9.9 4.6 11.2 4 12.5 4C14.6 4 16 5.4 16 7.5C16 10.1 13.6 12.2 9.45 15.7L10 17Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const SearchIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
    <path d="M15.5 15.5L19 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

interface BadgeIconProps {
  icon: ReactNode;
  badge?: number;
  className?: string;
  iconClassName?: string;
}

const BadgeIcon = ({ icon, badge = 0, className = '', iconClassName = '' }: BadgeIconProps) => (
  <div className={`relative ${className}`}>
    <div className={iconClassName}>
      {icon}
    </div>
    {badge > 0 && (
      <span className="
      absolute 
      -top-5 
      -right-5 
      bg-gradient-to-br from-red-500 to-red-600 
      text-white text-[10px] font-bold 
      rounded-full min-w-[20px] h-5 px-1.5 
      flex items-center justify-center 
      leading-none shadow-lg border-2 border-white 
      animate-pulse
    ">
        {badge > 99 ? '99+' : badge}
      </span>
    )}
  </div>
);

/**
 * Component that syncs search params with state
 * Must be wrapped in Suspense because it uses useSearchParams()
 */
function HeaderSearchSync({
  setSearchQuery,
  setSelectedCategory,
  categories,
}: {
  setSearchQuery: (_query: string) => void;
  setSelectedCategory: (_category: Category | null) => void;
  categories: Category[];
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const searchParam = searchParams.get('search');
    const categoryParam = searchParams.get('category');
    setSearchQuery(searchParam || '');
    
    // Set selected category from URL
    if (categoryParam && categories.length > 0) {
      const flattenCategories = (cats: Category[]): Category[] => {
        const result: Category[] = [];
        cats.forEach((cat) => {
          result.push(cat);
          if (cat.children && cat.children.length > 0) {
            result.push(...flattenCategories(cat.children));
          }
        });
        return result;
      };
      const allCategories = flattenCategories(categories);
      const foundCategory = allCategories.find((cat) => cat.slug === categoryParam);
      setSelectedCategory(foundCategory || null);
    } else {
      setSelectedCategory(null);
    }
  }, [searchParams, categories, setSearchQuery, setSelectedCategory]);

  return null;
}

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, isAdmin } = useAuth();
  const { t } = useTranslation();
  const [compareCount, setCompareCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [showCurrency, setShowCurrency] = useState(false);
  const [showMobileCurrency, setShowMobileCurrency] = useState(false);
  const [searchHoverExpanded, setSearchHoverExpanded] = useState(false);
  const [searchFocusExpanded, setSearchFocusExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('AMD');
  const [categories, setCategories] = useState<Category[]>([]);
  const [, setSelectedCategory] = useState<Category | null>(null);
  const currentYear = new Date().getFullYear();

  const currencyRef = useRef<HTMLDivElement>(null);
  const mobileCurrencyRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const topBarRef = useRef<HTMLDivElement>(null);
  const mainNavRef = useRef<HTMLElement>(null);
  const [topBarHeight, setTopBarHeight] = useState(0);
  const [mainNavHeight, setMainNavHeight] = useState(0);
  const [revealHeaderForCartFly, setRevealHeaderForCartFly] = useState(false);

  // Cart fly sets `revealHeaderForCartFly` only to snap transform transitions; it must not
  // join `suppressScrollHide` or the scroll hook would force the top bar open again.
  const suppressScrollHide =
    mobileMenuOpen ||
    showMobileCurrency;

  const headerScrollVisible = useHeaderScrollVisibility(suppressScrollHide);

  useEffect(() => {
    const revealMs = CART_FLY_ANIMATION_DURATION_MS + 280;
    let clearTimer: ReturnType<typeof setTimeout> | undefined;

    const onRevealForCart = () => {
      setRevealHeaderForCartFly(true);
      if (clearTimer) clearTimeout(clearTimer);
      clearTimer = setTimeout(() => setRevealHeaderForCartFly(false), revealMs);
    };

    window.addEventListener(HEADER_REVEAL_FOR_CART_EVENT, onRevealForCart);
    return () => {
      window.removeEventListener(HEADER_REVEAL_FOR_CART_EVENT, onRevealForCart);
      if (clearTimer) clearTimeout(clearTimer);
    };
  }, []);

  useLayoutEffect(() => {
    const top = topBarRef.current;
    const nav = mainNavRef.current;
    const measure = () => {
      if (top) setTopBarHeight(top.getBoundingClientRect().height);
      if (nav) setMainNavHeight(nav.getBoundingClientRect().height);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (top) ro.observe(top);
    if (nav) ro.observe(nav);
    return () => ro.disconnect();
  }, []);

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
    lang: getStoredLanguage(),
  });

  const fetchCart = async () => {
    if (!isLoggedIn) {
      if (typeof window === 'undefined') {
        setCartCount(0);
        setCartTotal(0);
        return;
      }

      try {
        const stored = localStorage.getItem(CART_KEY);
        const guestCart: Array<{ productId: string; productSlug?: string; variantId: string; quantity: number; price?: number }> = stored ? JSON.parse(stored) : [];

        if (guestCart.length === 0) {
          setCartCount(0);
          setCartTotal(0);
          return;
        }

        const itemsCount = guestCart.reduce((sum, item) => sum + item.quantity, 0);
        const total = guestCart.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
        setCartCount(itemsCount);
        setCartTotal(total);
        writeCartSummaryCache(itemsCount, total);
      } catch (error) {
        console.error('Error loading guest cart:', error);
        setCartCount(0);
        setCartTotal(0);
        writeCartSummaryCache(0, 0);
      }
      return;
    }

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setCartCount(0);
        setCartTotal(0);
        return;
      }
    }

    try {
      const response = await apiClient.get<{
        cart: {
          itemsCount: number;
          totals: {
            total: number;
          };
        };
      }>('/api/v1/cart');

      setCartCount(response.cart?.itemsCount || 0);
      setCartTotal(response.cart?.totals?.total || 0);
      writeCartSummaryCache(response.cart?.itemsCount || 0, response.cart?.totals?.total || 0);
    } catch (error: unknown) {
      const err = error as { status?: number; statusCode?: number };
      const status = err?.status ?? err?.statusCode;
      const isUnauthorized = status === 401;
      const isServerError = typeof status === 'number' && status >= 500;
      if (!isUnauthorized && !isServerError) {
        console.error('Error fetching cart:', error);
      }
      setCartCount(0);
      setCartTotal(0);
      writeCartSummaryCache(0, 0);
    }
  };

  // Load wishlist and compare counts from localStorage
  useEffect(() => {
    const cached = readCartSummaryCache();
    if (cached) {
      setCartCount(cached.itemsCount);
      setCartTotal(cached.total);
    }

    const updateCounts = () => {
      setWishlistCount(getWishlistCount());
      setCompareCount(getCompareCount());
    };

    // Initial load
    updateCounts();

    // Listen for updates
    const handleWishlistUpdate = () => {
      setWishlistCount(getWishlistCount());
    };

    const handleCompareUpdate = () => {
      setCompareCount(getCompareCount());
    };

    const handleAuthUpdate = () => {
      // Refresh counts when auth state changes
      updateCounts();
      fetchCart();
    };

    const handleCartUpdate = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail?.optimisticAdd) {
        const nextQuantity = detail.optimisticAdd.quantity ?? 1;
        const nextPrice = detail.optimisticAdd.price ?? 0;
        setCartCount((c) => {
          const nextCount = c + nextQuantity;
          setCartTotal((t) => {
            const nextTotal = t + nextPrice * nextQuantity;
            writeCartSummaryCache(nextCount, nextTotal);
            return nextTotal;
          });
          return nextCount;
        });
        return;
      }
      if (detail?.itemsCount !== undefined && detail?.total !== undefined) {
        setCartCount(detail.itemsCount);
        setCartTotal(detail.total);
        writeCartSummaryCache(detail.itemsCount, detail.total);
        return;
      }
      fetchCart();
    };

    window.addEventListener('wishlist-updated', handleWishlistUpdate);
    window.addEventListener('compare-updated', handleCompareUpdate);
    window.addEventListener('auth-updated', handleAuthUpdate);
    window.addEventListener('cart-updated', handleCartUpdate);

    return () => {
      window.removeEventListener('wishlist-updated', handleWishlistUpdate);
      window.removeEventListener('compare-updated', handleCompareUpdate);
      window.removeEventListener('auth-updated', handleAuthUpdate);
      window.removeEventListener('cart-updated', handleCartUpdate);
    };
  }, [isLoggedIn]);

  // Fetch cart when logged in state changes
  useEffect(() => {
    fetchCart();
  }, [isLoggedIn]);

  // Load currency from localStorage
  useEffect(() => {
    setSelectedCurrency(getStoredCurrency());

    const handleCurrencyUpdate = () => {
      setSelectedCurrency(getStoredCurrency());
    };

    window.addEventListener('currency-updated', handleCurrencyUpdate);

    return () => {
      window.removeEventListener('currency-updated', handleCurrencyUpdate);
    };
  }, []);

  // Initialize and update currency rates
  useEffect(() => {
    // Load currency rates on mount
    initializeCurrencyRates().catch(console.error);

    // Listen for currency rates updates (when admin changes rates)
    const handleCurrencyRatesUpdate = () => {
      clearCurrencyRatesCache();
      // Force reload to get fresh rates from API
      initializeCurrencyRates(true).catch(console.error);
      // Force re-render by dispatching currency-updated event
      window.dispatchEvent(new Event('currency-updated'));
    };

    window.addEventListener('currency-rates-updated', handleCurrencyRatesUpdate);

    return () => {
      window.removeEventListener('currency-rates-updated', handleCurrencyRatesUpdate);
    };
  }, []);

  // Sync search input with URL params - handled by HeaderSearchSync component wrapped in Suspense

  // Fetch categories (language is always 'en')
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      // Small delay to avoid simultaneous requests
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Language is always 'en'
      const response = await apiClient.get<CategoriesResponse>('/api/v1/categories/tree', {
        params: { lang: 'en' },
      });
      setCategories(response.data || []);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setCategories([]);
    }
  };

  const selectedCurrencyInfo = CURRENCIES[selectedCurrency];
  const searchExpanded = searchHoverExpanded || searchFocusExpanded || searchQuery.trim().length > 0;
  const userNavHref = isLoggedIn ? '/profile' : '/login';

  useEffect(() => {
    HEADER_FAST_NAV_ROUTES.forEach((href) => {
      void router.prefetch(href);
    });
    void router.prefetch(userNavHref);
    if (isAdmin) {
      void router.prefetch('/supersudo');
    }
  }, [isAdmin, router, userNavHref]);

  const prefetchRoute = (href: string) => {
    void router.prefetch(href);
  };

  const getFastNavHandlers = (href: string) => ({
    prefetch: true,
    onMouseEnter: () => prefetchRoute(href),
    onTouchStart: () => prefetchRoute(href),
    onFocus: () => prefetchRoute(href),
  });

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (currencyRef.current && !currencyRef.current.contains(event.target as Node)) {
        setShowCurrency(false);
      }
      if (mobileCurrencyRef.current && !mobileCurrencyRef.current.contains(event.target as Node)) {
        setShowMobileCurrency(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    if (mobileMenuOpen) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
  }, [mobileMenuOpen]);

  // Close mobile menu on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') {
        return;
      }

      if (mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [mobileMenuOpen]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    const selected = searchSelectedIndex >= 0 && searchResults[searchSelectedIndex];
    if (selected) {
      router.push(`/products/${selected.slug}`);
      clearSearch();
      return;
    }
    const params = new URLSearchParams();
    if (query) {
      params.set('search', query);
    }
    clearSearch();
    const queryString = params.toString();
    router.push(queryString ? `/shop?${queryString}` : '/shop');
  };

  /**
   * Updates currency selection and notifies the app with a visible log entry.
   */
  const handleCurrencyChange = (currency: CurrencyCode) => {
    console.info('[Header][LangCurrency] Currency changed', {
      from: selectedCurrency,
      to: currency,
    });
    setStoredCurrency(currency);
    setSelectedCurrency(currency);
    setShowCurrency(false);
    // Trigger currency update event to refresh prices
    window.dispatchEvent(new Event('currency-updated'));
  };

  // Always reserve the full fixed-header stack so toggling the top bar does not
  // change document height / scrollY (that caused show↔hide flicker on slow scroll).
  const spacerHeight = topBarHeight + mainNavHeight;

  return (
    <>
      <Suspense fallback={null}>
        <HeaderSearchSync
          setSearchQuery={setSearchQuery}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
        />
      </Suspense>
      <div
        aria-hidden
        className="shrink-0 overflow-hidden transition-[height] duration-300 ease-out"
        style={{ height: spacerHeight }}
      />
      {/* Desktop top bar — hides on scroll down; main nav stays visible */}
      <div
        ref={topBarRef}
        className={`fixed top-0 inset-x-0 z-[60] hidden md:block bg-white border-b border-gray-200 ${
          revealHeaderForCartFly ? 'transition-none' : HEADER_TOPBAR_SCROLL_TRANSITION_CLASS
        } ${
          headerScrollVisible ? 'translate-y-0' : '-translate-y-full pointer-events-none'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 py-3 text-sm text-gray-700 sm:flex-row sm:items-center sm:justify-between">
            {/* Phone + Social */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex items-center gap-2 text-gray-700">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 3C2 2.44772 2.44772 2 3 2H5.15287C5.64171 2 6.0589 2.35341 6.13927 2.8356L6.87858 7.27147C6.95075 7.70451 6.73206 8.13397 6.3394 8.3303L4.79126 9.10437C5.90715 11.8783 8.12168 14.0929 10.8956 15.2088L11.6697 13.6606C11.866 13.2679 12.2955 13.0493 12.7285 13.1214L17.1644 13.8607C17.6466 13.9411 18 14.3583 18 14.8471V17C18 17.5523 17.5523 18 17 18H15C7.8203 18 2 12.1797 2 5V3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="font-medium">{t('contact.phone')}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <a
                  href={t('contact.social.instagram') || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-pink-600 transition-colors"
                  aria-label={t('common.ariaLabels.instagram')}
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href={t('contact.social.facebook') || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 transition-colors"
                  aria-label={t('common.ariaLabels.facebook')}
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href={t('contact.social.linkedin') || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-700 transition-colors"
                  aria-label={t('common.ariaLabels.linkedin')}
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Currency and Language Switcher */}
            <div className="flex flex-wrap items-center gap-3 sm:justify-end">
              <LanguageSwitcherHeader />
              <div className="relative" ref={currencyRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCurrency(!showCurrency);
                  }}
                  className={`inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200/90 px-3 text-gray-800 shadow-sm transition-colors ${
                    showCurrency ? 'bg-gray-200' : 'bg-gray-100 hover:bg-gray-200/90'
                  }`}
                >
                  <span className="text-sm font-semibold leading-none tabular-nums">{selectedCurrencyInfo.symbol}</span>
                  <span className="text-sm font-medium leading-none tabular-nums">{selectedCurrency}</span>
                  <ChevronDownIcon />
                </button>
                {showCurrency && (
                  <div className="absolute top-full right-0 mt-2 w-40 bg-white z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {Object.values(CURRENCIES).map((currency) => (
                      <button
                        key={currency.code}
                        onClick={() => handleCurrencyChange(currency.code)}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-150 ${selectedCurrency === currency.code
                            ? 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-900 font-semibold'
                            : 'text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{currency.code}</span>
                          <span className="text-gray-500">{currency.symbol}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main nav row — logo, links, icons; stays visible; moves up when top bar hides */}
      <header
        ref={mainNavRef}
        style={{
          top: 0,
          transform: headerScrollVisible
            ? `translateY(${topBarHeight}px)`
            : 'translateY(0)',
        }}
        className={`fixed inset-x-0 z-50 border-b border-gray-200/80 bg-gradient-to-b from-gray-50 to-white bg-white/95 shadow-sm backdrop-blur-sm ${
          revealHeaderForCartFly ? 'transition-none' : HEADER_TOPBAR_SCROLL_TRANSITION_CLASS
        }`}
      >
      <div className="max-w-7xl mx-auto pl-2 sm:pl-4 md:pl-6 lg:pl-8 pr-2 sm:pr-4 md:pr-6 lg:pr-8">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 py-4 md:py-3">
          {/* Logo + Mobile Menu */}
          <div className="relative flex w-full items-center justify-between md:w-auto md:justify-start">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
              aria-label={t('common.ariaLabels.openMenu')}
              aria-expanded={mobileMenuOpen}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            <div className="hidden md:block">
              <BrandLogoLink />
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 md:hidden">
              <BrandLogoLink />
            </div>
            {/* Mobile language + currency via single globe */}
            <div className="flex items-center gap-1 sm:gap-2 md:hidden">
              <div className="relative" ref={mobileCurrencyRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileCurrency(!showMobileCurrency);
                  }}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200/90 bg-gray-100 text-gray-800 shadow-sm transition-colors cursor-pointer ${
                    showMobileCurrency ? 'bg-gray-200' : 'bg-gray-100 hover:bg-gray-200/90'
                  }`}
                  aria-label="Change language and currency"
                >
                  <Globe className="h-5 w-5" />
                </button>
                {showMobileCurrency && (
                  <div className="absolute top-full right-0 mt-2 w-52 rounded-xl border border-gray-200 bg-white p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="rounded-lg border border-gray-100 px-2 py-2">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Language</p>
                      <LanguageSwitcherHeader />
                    </div>
                    <div className="mt-2 rounded-lg border border-gray-100 p-1">
                      <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Currency</p>
                      {Object.values(CURRENCIES).map((currency) => (
                        <button
                          key={currency.code}
                          onClick={() => {
                            handleCurrencyChange(currency.code);
                            setShowMobileCurrency(false);
                          }}
                          className={`w-full rounded-md px-3 py-2 text-left text-sm transition-all duration-150 ${
                            selectedCurrency === currency.code
                              ? 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-900 font-semibold'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{currency.code}</span>
                            <span className="text-gray-500">{currency.symbol}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Links - Centered */}
          <nav className="order-3 hidden w-full items-center justify-center gap-1 md:order-none md:flex md:flex-1">
            <Link
              href="/"
              {...getFastNavHandlers('/')}
              className={headerTextNavClassName(isHeaderNavActive(pathname, '/'))}
              aria-current={isHeaderNavActive(pathname, '/') ? 'page' : undefined}
            >
              {t('common.navigation.home')}
            </Link>
            <Link
              href="/shop"
              {...getFastNavHandlers('/shop')}
              className={headerTextNavClassName(isHeaderNavActive(pathname, '/shop'))}
              aria-current={isHeaderNavActive(pathname, '/shop') ? 'page' : undefined}
            >
              {t('common.navigation.products')}
            </Link>
            <Link
              href="/about"
              {...getFastNavHandlers('/about')}
              className={headerTextNavClassName(isHeaderNavActive(pathname, '/about'))}
              aria-current={isHeaderNavActive(pathname, '/about') ? 'page' : undefined}
            >
              {t('common.navigation.about')}
            </Link>
            <Link
              href="/contact"
              {...getFastNavHandlers('/contact')}
              className={headerTextNavClassName(isHeaderNavActive(pathname, '/contact'))}
              aria-current={isHeaderNavActive(pathname, '/contact') ? 'page' : undefined}
            >
              {t('common.navigation.contact')}
            </Link>
          </nav>


          {/* Right Side Actions - Icons Only */}
          <div className="ml-auto hidden items-center gap-2 md:flex">
            <div
              className="relative mr-1"
              onMouseEnter={() => setSearchHoverExpanded(true)}
              onMouseLeave={() => setSearchHoverExpanded(false)}
            >
              <form onSubmit={handleSearch} className="relative flex items-center h-11">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onFocus={() => {
                    setSearchFocusExpanded(true);
                    if (searchQuery.trim().length >= 1) {
                      setSearchDropdownOpen(true);
                    }
                  }}
                  onBlur={() => {
                    setSearchFocusExpanded(false);
                  }}
                  onChange={(e) => {
                    const nextQuery = e.target.value;
                    setSearchQuery(nextQuery);
                    setSearchDropdownOpen(nextQuery.trim().length >= 1);
                  }}
                  onKeyDown={searchHandleKeyDown}
                  placeholder={t('common.placeholders.search')}
                  className={`h-11 rounded-lg text-sm transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-gray-400 ${
                    searchExpanded
                      ? 'w-64 lg:w-72 border-2 border-gray-200 bg-white pl-4 pr-12 text-gray-900 placeholder:text-gray-400 focus:border-transparent'
                      : 'w-11 border border-gray-200/90 bg-white pl-0 pr-0 text-transparent placeholder:text-transparent caret-transparent cursor-pointer'
                  }`}
                  aria-controls="search-results"
                  aria-expanded={searchDropdownOpen && searchResults.length > 0}
                  aria-autocomplete="list"
                />
                <button
                  type="submit"
                  onClick={(event: ReactMouseEvent<HTMLButtonElement>) => {
                    if (!searchExpanded) {
                      event.preventDefault();
                      setSearchHoverExpanded(true);
                      searchInputRef.current?.focus();
                    }
                  }}
                  className={`absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-lg transition-colors ${
                    searchExpanded
                      ? 'bg-gray-900 text-white hover:bg-gray-800'
                      : 'bg-transparent text-gray-700 hover:text-gray-900'
                  }`}
                  aria-label={t('common.ariaLabels.search')}
                >
                  <SearchIcon />
                </button>
              </form>
              <SearchDropdown
                results={searchResults}
                loading={searchLoading}
                error={searchError}
                isOpen={searchDropdownOpen}
                selectedIndex={searchSelectedIndex}
                query={searchQuery}
                onResultClick={(result) => {
                  router.push(`/products/${result.slug}`);
                  setSearchDropdownOpen(false);
                  clearSearch();
                }}
                onClose={() => setSearchDropdownOpen(false)}
                onSeeAllClick={() => setSearchDropdownOpen(false)}
              />
            </div>

            {/* Icons */}
              {/* Profile / User Menu */}
              <div className="relative">
                {isLoggedIn ? (
                  <Link
                    href="/profile"
                    {...getFastNavHandlers('/profile')}
                    className={headerIconNavClassName(isHeaderNavActive(pathname, '/profile'))}
                    aria-current={isHeaderNavActive(pathname, '/profile') ? 'page' : undefined}
                    aria-label={t('common.navigation.profile')}
                  >
                    <ProfileIconFilled />
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    {...getFastNavHandlers('/login')}
                    className={headerIconNavClassName(isHeaderNavActive(pathname, '/login'))}
                    aria-current={isHeaderNavActive(pathname, '/login') ? 'page' : undefined}
                  >
                    <ProfileIconOutline />
                  </Link>
                )}
              </div>

              {/* Compare */}
              <Link
                href="/compare"
                {...getFastNavHandlers('/compare')}
                className={`${headerIconNavClassName(isHeaderNavActive(pathname, '/compare'))} relative group`}
                aria-current={isHeaderNavActive(pathname, '/compare') ? 'page' : undefined}
              >
                <BadgeIcon icon={<CompareIcon size={18} />} badge={compareCount} />
              </Link>

              {/* Wishlist */}
              <Link
                href="/wishlist"
                {...getFastNavHandlers('/wishlist')}
                className={`${headerIconNavClassName(isHeaderNavActive(pathname, '/wishlist'))} relative group`}
                aria-current={isHeaderNavActive(pathname, '/wishlist') ? 'page' : undefined}
              >
                <BadgeIcon icon={<WishlistIcon />} badge={wishlistCount} />
              </Link>

              {/* Shopping Cart */}
              <Link
                href="/cart"
                {...getFastNavHandlers('/cart')}
                className={`flex items-center gap-[0.hpx] group rounded-lg transition-colors ${
                  isHeaderNavActive(pathname, '/cart')
                    ? 'bg-gray-100 ring-1 ring-gray-200/90 p-0.5'
                    : ''
                }`}
                aria-current={isHeaderNavActive(pathname, '/cart') ? 'page' : undefined}
              >
                <div
                  data-cart-fly-target
                  className={`w-11 h-11 flex items-center justify-center transition-colors duration-150 relative ${
                    isHeaderNavActive(pathname, '/cart')
                      ? 'text-gray-900'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <BadgeIcon icon={<CartIcon size={19} />} badge={cartCount} />
                </div>
                <span
                  className={`font-bold text-sm hidden sm:block min-w-[3.25rem] transition-colors ${
                    isHeaderNavActive(pathname, '/cart')
                      ? 'text-gray-900'
                      : 'text-gray-800 group-hover:text-gray-900'
                  }`}
                >
                  {formatPrice(cartTotal, selectedCurrency)}
                </span>
              </Link>
            </div>
          </div>

      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex md:hidden bg-black/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="h-full min-h-screen w-1/2 min-w-[16rem] max-w-full bg-white flex flex-col shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <p className="text-lg font-semibold text-gray-900">Navigation</p>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-10 h-10 rounded-full border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors"
                aria-label={t('common.ariaLabels.closeMenu')}
              >
                <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-hidden min-h-0">
              <nav className="flex h-full flex-col border-y border-gray-200 text-sm font-semibold uppercase tracking-wide text-gray-800 bg-white">
                <div className="flex-1 overflow-y-auto divide-y divide-gray-200">
                  {primaryNavLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      {...getFastNavHandlers(link.href)}
                      onClick={() => setMobileMenuOpen(false)}
                      className={headerMobileRowClassName(isHeaderNavActive(pathname, link.href))}
                      aria-current={isHeaderNavActive(pathname, link.href) ? 'page' : undefined}
                    >
                      {t(link.translationKey)}
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}

                  <Link
                    href="/wishlist"
                    {...getFastNavHandlers('/wishlist')}
                    onClick={() => setMobileMenuOpen(false)}
                    className={headerMobileRowClassName(isHeaderNavActive(pathname, '/wishlist'))}
                    aria-current={isHeaderNavActive(pathname, '/wishlist') ? 'page' : undefined}
                  >
                    <span
                      className={`flex items-center gap-2 normal-case font-medium ${
                        isHeaderNavActive(pathname, '/wishlist') ? 'text-gray-900' : 'text-gray-700'
                      }`}
                    >
                      <WishlistIcon />
                      {t('common.navigation.wishlist')}
                    </span>
                    {wishlistCount > 0 && (
                      <span className="rounded-full bg-gray-900 px-2 py-0.5 text-xs font-semibold text-white">
                        {wishlistCount > 99 ? '99+' : wishlistCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/compare"
                    {...getFastNavHandlers('/compare')}
                    onClick={() => setMobileMenuOpen(false)}
                    className={headerMobileRowClassName(isHeaderNavActive(pathname, '/compare'))}
                    aria-current={isHeaderNavActive(pathname, '/compare') ? 'page' : undefined}
                  >
                    <span
                      className={`flex items-center gap-2 normal-case font-medium ${
                        isHeaderNavActive(pathname, '/compare') ? 'text-gray-900' : 'text-gray-700'
                      }`}
                    >
                      <CompareIcon size={18} />
                      Compare
                    </span>
                    {compareCount > 0 && (
                      <span className="rounded-full bg-gray-900 px-2 py-0.5 text-xs font-semibold text-white">
                        {compareCount > 99 ? '99+' : compareCount}
                      </span>
                    )}
                  </Link>

                  {isLoggedIn ? (
                    <>
                      {isAdmin && (
                        <Link
                          href="/supersudo"
                          {...getFastNavHandlers('/supersudo')}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center justify-between px-4 py-3 normal-case ${
                            isHeaderNavActive(pathname, '/supersudo')
                              ? 'bg-gray-200/90 text-gray-900 font-semibold'
                              : 'text-gray-800 hover:bg-gray-50'
                          }`}
                          aria-current={isHeaderNavActive(pathname, '/supersudo') ? 'page' : undefined}
                        >
                          <span>Admin Panel</span>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      )}
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        {...getFastNavHandlers('/login')}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`${headerMobileRowClassName(isHeaderNavActive(pathname, '/login'))} normal-case`}
                        aria-current={isHeaderNavActive(pathname, '/login') ? 'page' : undefined}
                      >
                        <span>Login</span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      <Link
                        href="/register"
                        {...getFastNavHandlers('/register')}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-4 py-3 normal-case font-semibold ${
                          isHeaderNavActive(pathname, '/register')
                            ? 'bg-gray-100 text-gray-900 ring-1 ring-inset ring-gray-200/90'
                            : 'text-gray-900 hover:bg-gray-900 hover:text-white'
                        }`}
                        aria-current={isHeaderNavActive(pathname, '/register') ? 'page' : undefined}
                      >
                        <span>Create account</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </>
                  )}
                </div>

                <div className="border-t border-gray-200 px-4 py-4 text-xs font-medium tracking-wide text-gray-500 normal-case">
                  © {currentYear} Degusto
                </div>
              </nav>
            </div>
          </div>
        </div>
      )}
    </header>

    </>
  );
}

