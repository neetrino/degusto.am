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
  bottomNavBackground: '/api/r2/navigation/20260512-Dgnu58TYo3.svg',
  bottomNavHome: '/api/r2/navigation/20260512-zomFTx64fK.svg',
  bottomNavCart: '/api/r2/navigation/20260512-uAd4OmdwhO.svg',
  bottomNavFavorite: '/api/r2/navigation/20260512-rq6TGa1j4e.svg',
  bottomNavProfile: '/api/r2/navigation/20260512-0QvW2JXVIb.svg',
  bottomNavShop: '/api/r2/navigation/20260512-NuBb07Yghg.svg',
} as const;

export const MOBILE_SHOP_BOTTOM_NAV_ASSETS = {
  bottomNavBackground: '/api/r2/navigation/20260512-d3glmDYnXw.svg',
  bottomNavShop: '/api/r2/navigation/20260512-qSIccpktNL.svg',
  bottomNavShopIcon: '/api/r2/navigation/20260512-BQZihnmfb2.svg',
  bottomNavHome: '/api/r2/navigation/20260512-l6dbCo33w3.svg',
  bottomNavCart: '/api/r2/navigation/20260512-W6yz-_u1_J.svg',
  bottomNavFavorite: '/api/r2/navigation/20260512-Krr_aEiAGb.svg',
  bottomNavProfile: '/api/r2/navigation/20260512-npk36RTIVm.svg',
} as const;

export function resolveMobileBottomNavAssets(pathname: string | null): MobileBottomNavResolvedAssets {
  if (pathname === '/shop') {
    return { ...MOBILE_SHOP_BOTTOM_NAV_ASSETS };
  }
  return { ...MOBILE_HOME_BOTTOM_NAV_ASSETS };
}

export function isShopMobileBottomNavAssetSet(assets: { bottomNavCart: string }): boolean {
  return assets.bottomNavCart === MOBILE_SHOP_BOTTOM_NAV_ASSETS.bottomNavCart;
}
