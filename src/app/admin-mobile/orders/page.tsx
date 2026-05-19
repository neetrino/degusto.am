'use client';

import { useTranslation } from '../../../lib/i18n-client';
import { AdminMobileOrdersContent } from '../AdminMobileOrdersContent';
import { AdminMobileSubpageShell } from '../AdminMobileSubpageShell';
import { useAdminMobileGuard } from '../useAdminMobileGuard';

export default function AdminMobileOrdersPage() {
  const { t } = useTranslation();
  const { isReady, isLoading } = useAdminMobileGuard({
    desktopRedirectPath: '/supersudo/orders',
  });

  if (isLoading || !isReady) {
    return (
      <div className="mx-auto w-full max-w-md px-4 pb-8 pt-6 lg:hidden">
        <div className="h-[320px] animate-pulse rounded-2xl bg-gray-100" aria-hidden />
      </div>
    );
  }

  return (
    <AdminMobileSubpageShell title={t('admin.menu.orders')}>
      <AdminMobileOrdersContent />
    </AdminMobileSubpageShell>
  );
}
