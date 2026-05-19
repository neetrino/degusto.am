'use client';

import { AdminMobileHubPage } from './AdminMobileHubPage';
import { useAdminMobileGuard } from './useAdminMobileGuard';

export default function AdminMobilePage() {
  const { isReady, isLoading } = useAdminMobileGuard();

  if (isLoading || !isReady) {
    return (
      <div className="mx-auto w-full max-w-md px-4 pb-8 pt-6 lg:hidden">
        <div className="h-[280px] animate-pulse rounded-2xl bg-gray-100" aria-hidden />
      </div>
    );
  }

  return <AdminMobileHubPage />;
}
