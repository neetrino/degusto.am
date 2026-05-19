export const ADMIN_MOBILE_HUB_PATH = '/admin-mobile';

export const ADMIN_MOBILE_ANALYTICS_PATH = '/admin-mobile/analytics';
export const ADMIN_MOBILE_ORDERS_PATH = '/admin-mobile/orders';

/** @deprecated Use ADMIN_MOBILE_ANALYTICS_PATH */
export const ADMIN_MOBILE_PROFILE_ANALYTICS_PATH = ADMIN_MOBILE_ANALYTICS_PATH;

/** @deprecated Use ADMIN_MOBILE_ORDERS_PATH */
export const ADMIN_MOBILE_PROFILE_ORDERS_PATH = ADMIN_MOBILE_ORDERS_PATH;

export const ADMIN_MOBILE_HUB_ACTIVE_PATHS = [
  ADMIN_MOBILE_HUB_PATH,
  ADMIN_MOBILE_ANALYTICS_PATH,
  ADMIN_MOBILE_ORDERS_PATH,
] as const;

export function isAdminMobileHubActivePath(pathname: string): boolean {
  const normalized = pathname.split('?')[0]?.split('#')[0] ?? '';
  return ADMIN_MOBILE_HUB_ACTIVE_PATHS.some(
    (href) => normalized === href || normalized.startsWith(`${href}/`)
  );
}
