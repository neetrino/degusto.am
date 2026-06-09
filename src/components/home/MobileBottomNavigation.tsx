'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../lib/auth/AuthContext';
import { getMobileBottomNavActiveFlags, type MobileBottomNavActiveFlags } from './mobileBottomNavigationActive';
import { isShopMobileBottomNavAssetSet } from './mobileBottomNavAssets';
import { useCartDrawer } from '../cart-drawer/cart-drawer-context';
import { useMobileNavBadgeCounts } from '../hooks/useMobileNavBadgeCounts';
import { MobileBottomNavCountBadge } from './MobileBottomNavCountBadge';
import { useRoutePrefetch } from './useRoutePrefetch';

export type MobileBottomNavigationAssets = {
  bottomNavBackground: string;
  bottomNavShop: string;
  bottomNavShopIcon?: string;
  bottomNavHome: string;
  bottomNavCart: string;
  bottomNavFavorite: string;
  bottomNavProfile: string;
};

const NAV_ITEM_ACTIVE_CLASS = 'mobile-bottom-nav-item-active';

function mergeActiveClass(base: string, isActive: boolean): string {
  return isActive ? `${base} ${NAV_ITEM_ACTIVE_CLASS}` : base;
}

type BottomNavRowRenderContext = {
  assets: MobileBottomNavigationAssets;
  isLoggedIn: boolean;
  active: boolean;
  cartCount: number;
  wishlistCount: number;
};

type BottomNavRowCell =
  | { kind: 'spacer' }
  | {
      kind: 'link';
      id: string;
      href: (f: MobileBottomNavActiveFlags) => string;
      rowClass: string;
      isActive: (f: MobileBottomNavActiveFlags) => boolean;
      render: (ctx: BottomNavRowRenderContext) => ReactNode;
    };

const MOBILE_BOTTOM_NAV_ROW: BottomNavRowCell[] = [
  {
    kind: 'link',
    id: 'home',
    href: () => '/',
    rowClass: 'inline-flex h-[30px] w-[71px] items-center justify-center',
    isActive: (f) => f.isHomeActive,
    render: ({ active }) => (
      <span className="relative inline-flex h-[30px] w-[30px] items-center justify-center">
        <span
          className={active ? 'mobile-bottom-nav-fill-home-active' : 'mobile-bottom-nav-fill-home-inactive'}
          role="img"
          aria-label="Home"
        />
      </span>
    ),
  },
  {
    kind: 'link',
    id: 'cart',
    href: () => '/',
    rowClass: 'inline-flex h-[30px] w-[71px] items-start',
    isActive: (f) => f.isCartActive,
    render: ({ assets, active, cartCount }) => {
      const shop = isShopMobileBottomNavAssetSet(assets);
      return (
        <span className="relative inline-flex h-[30px] w-[71px] items-start">
          <span
            data-cart-fly-target
            className={
              active
                ? shop
                  ? 'mobile-bottom-nav-fill-cart-shop'
                  : 'mobile-bottom-nav-fill-cart-home'
                : shop
                  ? 'mobile-bottom-nav-fill-cart-shop-inactive'
                  : 'mobile-bottom-nav-fill-cart-home-inactive'
            }
            role="img"
            aria-label="Cart"
          />
          <MobileBottomNavCountBadge count={cartCount} />
        </span>
      );
    },
  },
  { kind: 'spacer' },
  {
    kind: 'link',
    id: 'favorites',
    href: () => '/wishlist',
    rowClass: 'inline-flex h-[30px] w-[71px] items-start',
    isActive: (f) => f.isFavoritesActive,
    render: ({ assets, active, wishlistCount }) => {
      const shop = isShopMobileBottomNavAssetSet(assets);
      return (
        <span className="relative inline-flex h-[30px] w-[71px] items-start">
          <span
            className={
              active
                ? shop
                  ? 'mobile-bottom-nav-fill-fav-shop'
                  : 'mobile-bottom-nav-fill-fav-home'
                : shop
                  ? 'mobile-bottom-nav-fill-fav-shop-inactive'
                  : 'mobile-bottom-nav-fill-fav-home-inactive'
            }
            role="img"
            aria-label="Favorites"
          />
          <MobileBottomNavCountBadge count={wishlistCount} />
        </span>
      );
    },
  },
  {
    kind: 'link',
    id: 'profile',
    href: (f) => f.profileHref,
    rowClass: 'inline-flex h-[30px] w-[71px] items-center justify-center',
    isActive: (f) => f.isProfileSlotActive,
    render: ({ isLoggedIn, active }) => (
      <span
        className={active ? 'mobile-bottom-nav-fill-profile-active' : 'mobile-bottom-nav-fill-profile-inactive'}
        role="img"
        aria-label={isLoggedIn ? 'Profile' : 'Login'}
      />
    ),
  },
];

function MobileBottomNavigationShopButton({
  assets,
  isShopActive,
}: {
  assets: MobileBottomNavigationAssets;
  isShopActive: boolean;
}) {
  const { getPrefetchHandlers } = useRoutePrefetch(['/shop']);

  return (
    <Link
      href="/shop"
      prefetch
      {...getPrefetchHandlers('/shop')}
      className="pointer-events-auto absolute left-1/2 top-[40px] inline-flex h-[70px] w-[70px] -translate-x-1/2 items-center justify-center relative"
      aria-label="Shop"
      aria-current={isShopActive ? 'page' : undefined}
    >
      <img
        src={assets.bottomNavShop}
        alt=""
        className="mobile-bottom-nav-shop-disc h-[70px] w-[70px] object-contain"
      />
      {assets.bottomNavShopIcon ? (
        <img
          src={assets.bottomNavShopIcon}
          alt=""
          className="mobile-bottom-nav-shop-glyph pointer-events-none absolute left-1/2 top-1/2 z-[1] h-[26px] w-[29px] -translate-x-1/2 -translate-y-[calc(50%+4px)] object-contain"
        />
      ) : null}
    </Link>
  );
}

function MobileBottomNavigationLinks({
  assets,
  flags,
  isLoggedIn,
  cartCount,
  wishlistCount,
}: {
  assets: MobileBottomNavigationAssets;
  flags: MobileBottomNavActiveFlags;
  isLoggedIn: boolean;
  cartCount: number;
  wishlistCount: number;
}) {
  const { openCartDrawer, isCartDrawerOpen } = useCartDrawer();
  const cartSlotActive = flags.isCartActive || isCartDrawerOpen;
  const renderContext = { assets, isLoggedIn, cartCount, wishlistCount };
  const navHrefs = MOBILE_BOTTOM_NAV_ROW.flatMap((cell) =>
    cell.kind === 'link' && cell.id !== 'cart' ? [cell.href(flags)] : []
  );
  const { getPrefetchHandlers } = useRoutePrefetch(navHrefs);

  return (
    <nav className="pointer-events-auto absolute bottom-[25px] left-1/2 flex -translate-x-1/2 items-start">
      {MOBILE_BOTTOM_NAV_ROW.map((cell) => {
        if (cell.kind === 'spacer') {
          return <span key="mid-spacer" className="inline-flex h-[24px] w-[71px]" aria-hidden />;
        }
        const active = cell.id === 'cart' ? cartSlotActive : cell.isActive(flags);
        if (cell.id === 'cart') {
          return (
            <button
              key={cell.id}
              type="button"
              onClick={() => openCartDrawer()}
              className={mergeActiveClass(cell.rowClass, active)}
              aria-current={active ? 'page' : undefined}
              aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : 'Cart'}
            >
              {cell.render({ ...renderContext, active })}
            </button>
          );
        }
        if (cell.id === 'home' && active) {
          return (
            <button
              key={cell.id}
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className={mergeActiveClass(cell.rowClass, active)}
              aria-current="page"
              aria-label="Home"
            >
              {cell.render({ ...renderContext, active })}
            </button>
          );
        }
        const favoritesLabel =
          cell.id === 'favorites' && wishlistCount > 0
            ? `Favorites, ${wishlistCount}`
            : undefined;
        const href = cell.href(flags);
        return (
          <Link
            key={cell.id}
            href={href}
            prefetch
            {...getPrefetchHandlers(href)}
            className={mergeActiveClass(cell.rowClass, active)}
            aria-current={active ? 'page' : undefined}
            aria-label={favoritesLabel}
          >
            {cell.render({ ...renderContext, active })}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileBottomNavigation({
  assets,
}: {
  assets: MobileBottomNavigationAssets;
}) {
  const [isHydrated, setIsHydrated] = useState(false);
  const pathname = usePathname() ?? '';
  const { isLoggedIn, isAdmin } = useAuth();
  const flags = getMobileBottomNavActiveFlags(pathname, isLoggedIn, isAdmin);
  const { cartCount, wishlistCount } = useMobileNavBadgeCounts();
  const safeCartCount = isHydrated ? cartCount : 0;
  const safeWishlistCount = isHydrated ? wishlistCount : 0;

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return (
    <div
      data-mobile-bottom-nav
      className="pointer-events-none fixed bottom-0 left-1/2 z-40 h-[159px] w-[375px] -translate-x-1/2"
    >
      <img src={assets.bottomNavBackground} alt="" className="absolute bottom-0 left-0 h-20 w-[375px] object-cover" />
      <MobileBottomNavigationShopButton
        assets={assets}
        isShopActive={flags.isShopActive}
      />
      <MobileBottomNavigationLinks
        assets={assets}
        flags={flags}
        isLoggedIn={isLoggedIn}
        cartCount={safeCartCount}
        wishlistCount={safeWishlistCount}
      />
    </div>
  );
}
