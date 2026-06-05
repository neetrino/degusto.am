/** Login and register use storefront mobile chrome (shared header + orange hero). */
export function isAuthStorefrontPage(pathname: string | null): boolean {
  return pathname === '/login' || pathname === '/register';
}

/**
 * Routes that use the shared Figma-style mobile shell (orange hero + header).
 * Home (`/`) renders its own shell inside the page; admin keeps legacy chrome.
 */
export function usesStorefrontMobileChrome(pathname: string | null): boolean {
  if (!pathname) {
    return false;
  }
  if (pathname === '/') {
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

/**
 * Checkout (and payment sub-routes) switch to desktop chrome at `md` (768px) for iPad portrait.
 * Tailwind classes must list `md:` variants explicitly — no dynamic breakpoint strings.
 */
export function usesCheckoutTabletDesktopLayout(pathname: string | null): boolean {
  if (!pathname) {
    return false;
  }
  return pathname === '/checkout' || pathname.startsWith('/checkout/');
}
