function isPathActive(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export type MobileBottomNavActiveFlags = {
  profileHref: string;
  isShopActive: boolean;
  isHomeActive: boolean;
  isCartActive: boolean;
  isFavoritesActive: boolean;
  isProfileSlotActive: boolean;
};

export function getMobileBottomNavActiveFlags(
  pathname: string,
  isLoggedIn: boolean
): MobileBottomNavActiveFlags {
  const profileHref = isLoggedIn ? '/profile' : '/login';
  const isProfileSlotActive = isLoggedIn
    ? isPathActive(pathname, '/profile')
    : pathname === '/login' || pathname === '/register';

  return {
    profileHref,
    isShopActive: pathname === '/shop' || pathname.startsWith('/shop/'),
    isHomeActive: pathname === '/',
    isCartActive: false,
    isFavoritesActive: isPathActive(pathname, '/wishlist'),
    isProfileSlotActive,
  };
}
