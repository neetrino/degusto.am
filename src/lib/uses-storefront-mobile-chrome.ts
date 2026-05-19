/**
 * Routes that use the shared Figma-style mobile shell (orange hero + white rounded body).
 * Home (`/`) renders its own shell inside the page; auth and admin keep legacy chrome.
 */
export function usesStorefrontMobileChrome(pathname: string | null): boolean {
  if (!pathname) {
    return false;
  }
  if (pathname === '/') {
    return false;
  }
  if (pathname === '/login' || pathname === '/register') {
    return false;
  }
  if (pathname.startsWith('/supersudo')) {
    return false;
  }
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin-mobile')) {
    return false;
  }
  return true;
}

/** Profile uses storefront chrome (bottom nav) but not the shared logo/search header. */
export function usesStorefrontMobileHeader(pathname: string | null): boolean {
  if (!pathname || !usesStorefrontMobileChrome(pathname)) {
    return false;
  }
  return !pathname.startsWith('/profile') && !pathname.startsWith('/admin-mobile');
}
