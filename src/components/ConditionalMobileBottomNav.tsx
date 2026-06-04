'use client';

import { usePathname } from 'next/navigation';
import { MobileBottomNavigation } from './home/MobileBottomNavigation';
import { resolveMobileBottomNavAssets } from './home/mobileBottomNavAssets';

export function ConditionalMobileBottomNav() {
  const pathname = usePathname();

  if (pathname?.startsWith('/supersudo')) {
    return null;
  }

  const assets = resolveMobileBottomNavAssets(pathname ?? null);

  return (
    <div className="lg:hidden">
      <MobileBottomNavigation
        assets={{
          bottomNavBackground: assets.bottomNavBackground,
          bottomNavShop: assets.bottomNavShop,
          bottomNavShopIcon: assets.bottomNavShopIcon,
          bottomNavHome: assets.bottomNavHome,
          bottomNavCart: assets.bottomNavCart,
          bottomNavFavorite: assets.bottomNavFavorite,
          bottomNavProfile: assets.bottomNavProfile,
        }}
      />
    </div>
  );
}
