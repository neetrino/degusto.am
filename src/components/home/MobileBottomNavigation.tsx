'use client';

import Link from 'next/link';

type MobileBottomNavigationAssets = {
  bottomNavBackground: string;
  bottomNavShop: string;
  bottomNavShopIcon?: string;
  bottomNavHome: string;
  bottomNavCart: string;
  bottomNavFavorite: string;
  bottomNavProfile: string;
};

export function MobileBottomNavigation({
  assets,
  onShopClick,
}: {
  assets: MobileBottomNavigationAssets;
  onShopClick: () => void;
}) {
  return (
    <div className="pointer-events-none fixed bottom-0 left-1/2 z-40 h-[159px] w-[375px] -translate-x-1/2">
      <img src={assets.bottomNavBackground} alt="" className="absolute bottom-0 left-0 h-20 w-[375px] object-cover" />
      <button
        type="button"
        onClick={onShopClick}
        className="pointer-events-auto absolute left-1/2 top-[40px] inline-flex h-[70px] w-[70px] -translate-x-1/2 items-center justify-center"
        aria-label="Shop"
      >
        <img src={assets.bottomNavShop} alt="" className="h-[70px] w-[70px] object-contain" />
        {assets.bottomNavShopIcon ? (
          <img src={assets.bottomNavShopIcon} alt="" className="absolute h-8 w-8 object-contain" />
        ) : null}
      </button>

      <nav className="pointer-events-auto absolute bottom-[25px] left-1/2 flex -translate-x-1/2 items-start">
        <Link href="/" className="inline-flex h-[30px] w-[71px] items-center justify-center">
          <span className="relative inline-flex h-[30px] w-[30px]">
            <img src={assets.bottomNavHome} alt="Home" className="absolute inset-[8.33%] h-[83.34%] w-[83.34%] object-contain" />
          </span>
        </Link>
        <Link href="/cart" className="inline-flex h-[30px] w-[71px] items-start">
          <img src={assets.bottomNavCart} alt="Cart" className="h-[30px] w-[71px] object-contain" />
        </Link>
        <span className="inline-flex h-[24px] w-[71px]" aria-hidden="true" />
        <Link href="/favorites" className="inline-flex h-[30px] w-[71px] items-start">
          <img src={assets.bottomNavFavorite} alt="Favorites" className="h-[30px] w-[71px] object-contain" />
        </Link>
        <Link href="/profile" className="inline-flex h-[30px] w-[71px] items-center justify-center">
          <img src={assets.bottomNavProfile} alt="Profile" className="h-[30px] w-[30px] object-contain" />
        </Link>
      </nav>
    </div>
  );
}
