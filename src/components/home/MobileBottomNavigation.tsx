'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../lib/auth/AuthContext';
import { getMobileBottomNavActiveFlags, type MobileBottomNavActiveFlags } from './mobileBottomNavigationActive';
import { isShopMobileBottomNavAssetSet } from './mobileBottomNavAssets';
import { useCartDrawer } from '../cart-drawer/cart-drawer-context';

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
    render: ({ assets, active }) => {
      const shop = isShopMobileBottomNavAssetSet(assets);
      return (
        <span
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
    render: ({ assets, active }) => {
      const shop = isShopMobileBottomNavAssetSet(assets);
      return (
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
  onShopClick,
}: {
  assets: MobileBottomNavigationAssets;
  isShopActive: boolean;
  onShopClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onShopClick}
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
    </button>
  );
}

function MobileBottomNavigationLinks({
  assets,
  flags,
  isLoggedIn,
}: {
  assets: MobileBottomNavigationAssets;
  flags: MobileBottomNavActiveFlags;
  isLoggedIn: boolean;
}) {
  const { openCartDrawer, isCartDrawerOpen } = useCartDrawer();
  const cartSlotActive = flags.isCartActive || isCartDrawerOpen;

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
            >
              {cell.render({ assets, isLoggedIn, active })}
            </button>
          );
        }
        return (
          <Link
            key={cell.id}
            href={cell.href(flags)}
            className={mergeActiveClass(cell.rowClass, active)}
            aria-current={active ? 'page' : undefined}
          >
            {cell.render({ assets, isLoggedIn, active })}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileBottomNavigation({
  assets,
  onShopClick,
}: {
  assets: MobileBottomNavigationAssets;
  onShopClick: () => void;
}) {
  const pathname = usePathname() ?? '';
  const { isLoggedIn, isAdmin } = useAuth();
  const flags = getMobileBottomNavActiveFlags(pathname, isLoggedIn, isAdmin);

  return (
    <div className="pointer-events-none fixed bottom-0 left-1/2 z-40 h-[159px] w-[375px] -translate-x-1/2">
      <img src={assets.bottomNavBackground} alt="" className="absolute bottom-0 left-0 h-20 w-[375px] object-cover" />
      <MobileBottomNavigationShopButton
        assets={assets}
        isShopActive={flags.isShopActive}
        onShopClick={onShopClick}
      />
      <MobileBottomNavigationLinks assets={assets} flags={flags} isLoggedIn={isLoggedIn} />
    </div>
  );
}
