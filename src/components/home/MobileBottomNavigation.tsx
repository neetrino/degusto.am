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
    render: ({ assets }) => (
      <span className="relative inline-flex h-[30px] w-[30px]">
        <img
          src={assets.bottomNavHome}
          alt="Home"
          className="absolute inset-[8.33%] h-[83.34%] w-[83.34%] object-contain"
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
      if (active) {
        const shop = isShopMobileBottomNavAssetSet(assets);
        return (
          <span
            className={shop ? 'mobile-bottom-nav-fill-cart-shop' : 'mobile-bottom-nav-fill-cart-home'}
            role="img"
            aria-label="Cart"
          />
        );
      }
      return <img src={assets.bottomNavCart} alt="Cart" className="h-[30px] w-[71px] object-contain" />;
    },
  },
  { kind: 'spacer' },
  {
    kind: 'link',
    id: 'favorites',
    href: () => '/favorites',
    rowClass: 'inline-flex h-[30px] w-[71px] items-start',
    isActive: (f) => f.isFavoritesActive,
    render: ({ assets, active }) => {
      if (active) {
        const shop = isShopMobileBottomNavAssetSet(assets);
        return (
          <span
            className={shop ? 'mobile-bottom-nav-fill-fav-shop' : 'mobile-bottom-nav-fill-fav-home'}
            role="img"
            aria-label="Favorites"
          />
        );
      }
      return <img src={assets.bottomNavFavorite} alt="Favorites" className="h-[30px] w-[71px] object-contain" />;
    },
  },
  {
    kind: 'link',
    id: 'profile',
    href: (f) => f.profileHref,
    rowClass: 'inline-flex h-[30px] w-[71px] items-center justify-center',
    isActive: (f) => f.isProfileSlotActive,
    render: ({ assets, isLoggedIn }) => (
      <img
        src={assets.bottomNavProfile}
        alt={isLoggedIn ? 'Profile' : 'Login'}
        className="h-[30px] w-[30px] object-contain"
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
      className={mergeActiveClass(
        'pointer-events-auto absolute left-1/2 top-[40px] inline-flex h-[70px] w-[70px] -translate-x-1/2 items-center justify-center',
        isShopActive
      )}
      aria-label="Shop"
      aria-current={isShopActive ? 'page' : undefined}
    >
      <img src={assets.bottomNavShop} alt="" className="h-[70px] w-[70px] object-contain" />
      {assets.bottomNavShopIcon ? (
        <img src={assets.bottomNavShopIcon} alt="" className="absolute h-8 w-8 object-contain" />
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
  const { isLoggedIn } = useAuth();
  const flags = getMobileBottomNavActiveFlags(pathname, isLoggedIn);

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
