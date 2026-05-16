'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { MobileBottomNavigation } from './home/MobileBottomNavigation';
import { resolveMobileBottomNavAssets } from './home/mobileBottomNavAssets';

export function ConditionalMobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname?.startsWith('/supersudo')) {
    return null;
  }

  const assets = resolveMobileBottomNavAssets(pathname ?? null);

  useEffect(() => {
    void router.prefetch('/shop');
  }, [router]);

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
        onShopClick={() => {
          router.push('/shop');
        }}
      />
    </div>
  );
}
