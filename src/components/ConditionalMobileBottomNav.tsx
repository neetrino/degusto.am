'use client';

import { usePathname } from 'next/navigation';
import { isAdminAppPath } from '@/lib/routing/is-admin-app-path';
import { MobileBottomNavigation } from './home/MobileBottomNavigation';
import { resolveMobileBottomNavAssets } from './home/mobileBottomNavAssets';
import { usesCheckoutTabletDesktopLayout } from '../lib/uses-storefront-mobile-chrome';

export function ConditionalMobileBottomNav() {
  const pathname = usePathname();

  if (isAdminAppPath(pathname)) {
    return null;
  }

  if (usesCheckoutTabletDesktopLayout(pathname)) {
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
