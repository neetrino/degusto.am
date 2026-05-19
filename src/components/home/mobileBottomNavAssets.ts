import { r2Asset } from '@/lib/r2-public-url';

/**
 * R2-backed artwork for the fixed mobile bottom navigation bar.
 * Shop route uses the alternate Figma asset set (center "shop" treatment).
 *
 * Cart / favorite mask fill classes in globals.css must use the same URLs
 * (see `.mobile-bottom-nav-fill-*`).
 */
export type MobileBottomNavResolvedAssets = {
  bottomNavBackground: string;
  bottomNavShop: string;
  bottomNavShopIcon?: string;
  bottomNavHome: string;
  bottomNavCart: string;
  bottomNavFavorite: string;
  bottomNavProfile: string;
};

export const MOBILE_HOME_BOTTOM_NAV_ASSETS = {
  bottomNavBackground: r2Asset('navigation/20260512-Dgnu58TYo3.svg'),
  bottomNavHome: r2Asset('navigation/20260512-zomFTx64fK.svg'),
  bottomNavCart: r2Asset('navigation/20260512-uAd4OmdwhO.svg'),
  bottomNavFavorite: r2Asset('navigation/20260512-rq6TGa1j4e.svg'),
  bottomNavProfile: r2Asset('navigation/20260512-0QvW2JXVIb.svg'),
  bottomNavShop: r2Asset('navigation/20260512-NuBb07Yghg.svg'),
} as const;

export const MOBILE_SHOP_BOTTOM_NAV_ASSETS = {
  bottomNavBackground: r2Asset('navigation/20260512-d3glmDYnXw.svg'),
  bottomNavShop: r2Asset('navigation/20260512-qSIccpktNL.svg'),
  bottomNavShopIcon: r2Asset('navigation/20260512-BQZihnmfb2.svg'),
  bottomNavHome: r2Asset('navigation/20260512-l6dbCo33w3.svg'),
  bottomNavCart: r2Asset('navigation/20260512-W6yz-_u1_J.svg'),
  bottomNavFavorite: r2Asset('navigation/20260512-Krr_aEiAGb.svg'),
  bottomNavProfile: r2Asset('navigation/20260512-npk36RTIVm.svg'),
} as const;

export function isShopMobileBottomNavRoute(pathname: string | null): boolean {
  return pathname === '/shop' || (pathname?.startsWith('/shop/') ?? false);
}

export function resolveMobileBottomNavAssets(pathname: string | null): MobileBottomNavResolvedAssets {
  if (isShopMobileBottomNavRoute(pathname)) {
    return { ...MOBILE_SHOP_BOTTOM_NAV_ASSETS };
  }
  return { ...MOBILE_HOME_BOTTOM_NAV_ASSETS };
}

export function isShopMobileBottomNavAssetSet(assets: { bottomNavCart: string }): boolean {
  return assets.bottomNavCart === MOBILE_SHOP_BOTTOM_NAV_ASSETS.bottomNavCart;
}

/**
 * Home SVGs in R2 are brand-filled (#F66A13) in both asset sets; tab colors use CSS masks
 * (see `.mobile-bottom-nav-fill-home-*` / `.mobile-bottom-nav-fill-profile-*` in globals.css).
 */
