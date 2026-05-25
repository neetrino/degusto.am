import { ADMIN_MOBILE_HUB_PATH } from '@/constants/admin-mobile-profile';
import { isMobileViewport } from '@/lib/viewport';

const ADMIN_DESKTOP_PATH = '/supersudo';

/**
 * Chooses the post-login route for admins (mobile hub vs desktop panel) and
 * honors an explicit `redirect` query when it targets admin-mobile.
 */
export function resolvePostLoginPath(options: {
  isAdmin: boolean;
  redirectTo: string;
}): string {
  const { isAdmin, redirectTo } = options;
  if (!isAdmin) {
    return redirectTo;
  }
  if (redirectTo.startsWith('/admin-mobile')) {
    return redirectTo;
  }
  if (isMobileViewport()) {
    return ADMIN_MOBILE_HUB_PATH;
  }
  return ADMIN_DESKTOP_PATH;
}
