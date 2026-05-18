'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { MobileBottomNavigation } from './home/MobileBottomNavigation';
import { resolveMobileBottomNavAssets } from './home/mobileBottomNavAssets';

export function ConditionalMobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    void router.prefetch('/shop');
    void router.prefetch('/admin-mobile');
    void router.prefetch('/admin-mobile/analytics');
    void router.prefetch('/admin-mobile/orders');
  }, [router]);

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
        onShopClick={() => {
          router.push('/shop');
        }}
      />
    </div>
  );
}
