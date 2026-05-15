'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LanguageCurrencySwitcher } from './LanguageCurrencySwitcher';
import { useTranslation } from '../lib/i18n-client';
import { useAuth } from '../lib/auth/AuthContext';
import { apiClient } from '../lib/api-client';
import { CART_KEY } from '../lib/storageCounts';
import { formatPrice } from '../lib/currency';
import { useCurrency } from './hooks/useCurrency';

const assets = {
  logo: 'https://www.figma.com/api/mcp/asset/b684f5ca-5543-4689-be84-ac53b6c5d14c',
  loginIcon: 'https://www.figma.com/api/mcp/asset/78b21874-ca2c-4a82-ad97-53f6d15d758a',
  cartIcon: 'https://www.figma.com/api/mcp/asset/6af1086c-a9ef-4e40-a198-a1dc8ae19a1b',
  cartCounterBubble: 'https://www.figma.com/api/mcp/asset/92cf106e-719d-418a-9062-442c2c704c3a',
  searchBadge: 'https://www.figma.com/api/mcp/asset/717cf64a-7dc5-44fd-8730-e63c2abe5677',
  searchIcon: 'https://www.figma.com/api/mcp/asset/79afe4c8-e7f4-44f9-8a3e-d76365facd5a',
  switcherIcon: 'https://www.figma.com/api/mcp/asset/7e774d0a-9c34-437c-b6a6-eb0f02674821',
  switcherArrow: 'https://www.figma.com/api/mcp/asset/7eb0464d-351a-4497-9966-932e83d0dc1c',
};

interface UniversalHeaderProps {
  spacerBackgroundClassName?: string;
}

interface GuestCartItem {
  quantity: number;
  price?: number;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, logout } = useAuth();
  const currency = useCurrency();
  const userNavHref = isLoggedIn ? '/profile' : '/login';

  useEffect(() => {
    const readGuestCart = () => {
      try {
        const stored = localStorage.getItem(CART_KEY);
        const parsed: unknown = stored ? JSON.parse(stored) : [];
        const items = Array.isArray(parsed) ? (parsed as GuestCartItem[]) : [];
        const itemsCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const total = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
        setCartCount(itemsCount);
        setCartTotal(total);
      } catch {
        setCartCount(0);
        setCartTotal(0);
      }
    };

    const fetchCart = async () => {
      if (!isLoggedIn) {
        readGuestCart();
        return;
      }

      try {
        const response = await apiClient.get<CartResponse>('/api/v1/cart');
        setCartCount(response.cart?.itemsCount || 0);
        setCartTotal(response.cart?.totals?.total || 0);
      } catch {
        setCartCount(0);
        setCartTotal(0);
      }
    };

    const handleCartUpdated = (event: Event) => {
      const detail = (event as CustomEvent)?.detail as
        | { optimisticAdd?: { quantity?: number; price?: number }; itemsCount?: number; total?: number }
        | undefined;

      if (detail?.optimisticAdd) {
        const nextQuantity = detail.optimisticAdd.quantity ?? 1;
        const nextPrice = detail.optimisticAdd.price ?? 0;
        setCartCount((prev) => prev + nextQuantity);
        setCartTotal((prev) => prev + nextPrice * nextQuantity);
        return;
      }

      if (detail?.itemsCount !== undefined && detail?.total !== undefined) {
        setCartCount(detail.itemsCount);
        setCartTotal(detail.total);
        return;
      }

      void fetchCart();
    };

    void fetchCart();
    window.addEventListener('cart-updated', handleCartUpdated);
    window.addEventListener('auth-updated', fetchCart);

    return () => {
      window.removeEventListener('cart-updated', handleCartUpdated);
      window.removeEventListener('auth-updated', fetchCart);
    };
  }, [isLoggedIn]);

  return (
    <>
      <div aria-hidden="true" className={`h-[104px] ${spacerBackgroundClassName}`} />
      <header className="fixed left-0 right-0 top-6 z-50 mx-auto flex h-20 w-full max-w-[1450px] items-center rounded-[120px] bg-black px-4 md:px-6 lg:px-7">
        <img src={assets.logo} alt="Degusto" className="h-12 w-[134px] shrink-0 object-contain" />
        <nav className="ml-8 mr-auto hidden items-center gap-[30px] whitespace-nowrap px-4 text-[18px] font-semibold leading-[30px] text-white lg:flex">
          <Link href="/" className="shrink-0">{t('common.navigation.home')}</Link>
          <Link href="/shop" className="shrink-0">{t('common.navigation.shop')}</Link>
          <Link href="/combo" className="shrink-0">{t('common.navigation.combo')}</Link>
          <Link href="/about" className="shrink-0">{t('common.navigation.about')}</Link>
        </nav>
        <div className="relative ml-auto hidden h-12 w-[237px] items-center rounded-[90px] bg-white p-1 transition-all duration-300 ease-out hover:w-[380px] focus-within:w-[380px] md:flex">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('common.placeholders.search')}
            className="h-full min-w-0 flex-1 bg-transparent pl-[14px] text-base leading-6 text-[#252525] outline-none placeholder:text-[rgba(105,105,105,0.56)]"
            aria-label={t('common.ariaLabels.search')}
          />
          <span className="relative ml-auto inline-flex h-10 items-center overflow-hidden rounded-[20px] bg-[#f66812] py-2 pl-10 pr-4">
            <span className="absolute left-0 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center overflow-hidden">
              <img src={assets.searchBadge} alt="" className="h-8 w-8 object-contain" />
              <img src={assets.searchIcon} alt="" className="absolute h-6 w-6 object-contain" />
            </span>
            <span className="text-[15px] font-semibold leading-6 text-white">{t('common.buttons.search')}</span>
          </span>
        </div>
        <div className="ml-3 flex items-center gap-[11px]">
          <div className="hidden items-center gap-[7px] md:flex">
            <Link href="/cart" className="relative h-12 w-[117px] shrink-0">
              <span className="absolute right-0 top-0 inline-flex h-12 w-[88px] items-center justify-center rounded-[70px] bg-white text-base font-bold text-black">
                {formatPrice(cartTotal, currency)}
              </span>
              <span data-cart-fly-target className="absolute bottom-[1px] left-2 inline-flex h-[34px] w-[37px] items-center justify-center">
                <img src={assets.cartIcon} alt="" className="h-[34px] w-[37px] object-contain" />
              </span>
              <span className="absolute left-[35px] top-[2px] inline-flex h-6 w-6 items-center justify-center">
                <img src={assets.cartCounterBubble} alt="" className="absolute h-6 w-6 object-contain" />
                <span className="relative text-sm font-bold leading-6 text-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              </span>
            </Link>
            <LanguageCurrencySwitcher
              variant="desktop"
              iconSrc={assets.switcherIcon}
              arrowSrc={assets.switcherArrow}
            />
          </div>
          <div className="group relative">
            <Link href={userNavHref} className="inline-flex h-12 w-12 items-center justify-center">
              <img src={assets.loginIcon} alt={isLoggedIn ? 'Profile' : 'Log in'} className="h-12 w-12 object-contain" />
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
