'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth/AuthContext';
import { isMobileViewport } from '../../lib/viewport';

type UseAdminMobileGuardOptions = {
  desktopRedirectPath?: string;
};

export function useAdminMobileGuard(options: UseAdminMobileGuardOptions = {}) {
  const router = useRouter();
  const pathname = usePathname() ?? '/admin-mobile';
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const desktopRedirectPath = options.desktopRedirectPath ?? '/supersudo';

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!isLoggedIn) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!isAdmin) {
      router.replace('/profile');
      return;
    }
    if (!isMobileViewport()) {
      router.replace(desktopRedirectPath);
    }
  }, [desktopRedirectPath, isAdmin, isLoading, isLoggedIn, pathname, router]);

  const isReady = !isLoading && isLoggedIn && isAdmin;

  return { isReady, isLoading };
}
