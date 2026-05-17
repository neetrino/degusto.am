function normalizePathname(pathname: string): string {
  const base = pathname.split('?')[0]?.split('#')[0] ?? '';
  if (!base || base === '/') {
    return base || '/';
  }
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

function isPathActive(pathname: string, href: string): boolean {
  const path = normalizePathname(pathname);
  if (href === '/') {
    return path === '/';
  }
  return path === href || path.startsWith(`${href}/`);
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
  const path = normalizePathname(pathname);
  const profileHref = isLoggedIn ? '/profile' : '/login';
  const isProfileSlotActive = isLoggedIn
    ? isPathActive(pathname, '/profile')
    : path === '/login' || path === '/register';

  return {
    profileHref,
    isShopActive: path === '/shop' || path.startsWith('/shop/'),
    isHomeActive: path === '/',
    isCartActive: false,
    isFavoritesActive: isPathActive(pathname, '/wishlist'),
    isProfileSlotActive,
  };
}
