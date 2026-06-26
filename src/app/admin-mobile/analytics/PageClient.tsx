'use client';

import { useTranslation } from '../../../lib/i18n-client';
import { AdminMobileAnalyticsContent } from '../AdminMobileAnalyticsContent';
import { AdminMobileSubpageShell } from '../AdminMobileSubpageShell';
import { useAdminMobileGuard } from '../useAdminMobileGuard';

export default function AdminMobileAnalyticsPage() {
  const { t } = useTranslation();
  const { isReady, isLoading } = useAdminMobileGuard({
    desktopRedirectPath: '/supersudo/analytics',
  });

  if (isLoading || !isReady) {
    return (
      <div className="mx-auto w-full max-w-md px-4 pb-8 pt-6 lg:hidden">
        <div className="h-[320px] animate-pulse rounded-2xl bg-gray-100" aria-hidden />
      </div>
    );
  }

  return (
    <AdminMobileSubpageShell title={t('admin.menu.analytics')}>
      <AdminMobileAnalyticsContent />
    </AdminMobileSubpageShell>
  );
}
