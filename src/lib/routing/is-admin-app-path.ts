const ADMIN_DESKTOP_PREFIX = '/supersudo';
const ADMIN_MOBILE_PREFIX = '/admin-mobile';

/**
 * True for desktop admin (`/supersudo`) and mobile admin hub routes.
 * Storefront commerce providers should not fetch on these paths.
 */
export function isAdminAppPath(pathname: string | null | undefined): boolean {
  if (!pathname) {
    return false;
  }
  const normalized = pathname.split('?')[0]?.split('#')[0] ?? '';
  return (
    normalized === ADMIN_DESKTOP_PREFIX
    || normalized.startsWith(`${ADMIN_DESKTOP_PREFIX}/`)
    || normalized === ADMIN_MOBILE_PREFIX
    || normalized.startsWith(`${ADMIN_MOBILE_PREFIX}/`)
  );
}
