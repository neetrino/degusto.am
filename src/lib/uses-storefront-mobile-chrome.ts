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
  if (pathname.startsWith('/supersudo') || pathname.startsWith('/admin')) {
    return false;
  }
  return true;
}
