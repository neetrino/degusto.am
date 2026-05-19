'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useTranslation } from '../../lib/i18n-client';
import { ADMIN_MOBILE_HUB_PATH } from '@/constants/admin-mobile-profile';

type AdminMobileSubpageShellProps = {
  title: string;
  children: ReactNode;
};

export function AdminMobileSubpageShell({ title, children }: AdminMobileSubpageShellProps) {
  const { t } = useTranslation();

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-4 pt-6 lg:hidden">
      <Link
        href={ADMIN_MOBILE_HUB_PATH}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#f66812]"
      >
        <span aria-hidden>←</span>
        {t('admin.mobileHub.back')}
      </Link>
      <h1 className="mb-4 text-xl font-semibold text-gray-900">{title}</h1>
      {children}
    </div>
  );
}