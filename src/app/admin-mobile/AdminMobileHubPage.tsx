'use client';

import Link from 'next/link';
import { BarChart3, ClipboardList } from 'lucide-react';
import { useTranslation } from '../../lib/i18n-client';
import { useAuth } from '../../lib/auth/AuthContext';
import { UserAvatar } from '../../components/UserAvatar';
import {
  ADMIN_MOBILE_ANALYTICS_PATH,
  ADMIN_MOBILE_ORDERS_PATH,
} from '@/constants/admin-mobile-profile';

const HUB_ITEMS = [
  {
    href: ADMIN_MOBILE_ANALYTICS_PATH,
    labelKey: 'admin.menu.analytics',
    icon: BarChart3,
  },
  {
    href: ADMIN_MOBILE_ORDERS_PATH,
    labelKey: 'admin.menu.orders',
    icon: ClipboardList,
  },
] as const;

function ChevronRight() {
  return (
    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function AdminMobileHubPage() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName || user?.lastName || user?.email || t('admin.mobileHub.title');

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-8 pt-6 lg:hidden">
      <div className="mb-5 flex items-center gap-4">
        <UserAvatar
          firstName={user?.firstName}
          lastName={user?.lastName}
          avatarUrl={null}
          size="lg"
          className="h-20 w-20 text-xl"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xl font-semibold text-gray-900">{displayName}</p>
          {user?.email ? <p className="truncate text-sm text-gray-600">{user.email}</p> : null}
        </div>
      </div>

      <p className="mb-3 text-sm font-medium text-gray-500">{t('admin.mobileHub.subtitle')}</p>

      <div className="divide-y divide-gray-100 rounded-2xl border border-gray-200/80 bg-white">
        {HUB_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-gray-50"
            >
              <span className="flex items-center gap-3 text-base font-medium text-gray-800">
                <span className="text-[#f66812]">
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </span>
                {t(item.labelKey)}
              </span>
              <ChevronRight />
            </Link>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => void logout()}
        className="mt-4 flex w-full items-center justify-center rounded-2xl border border-red-100 bg-white px-4 py-3.5 text-base font-semibold text-red-600 transition-colors hover:bg-red-50"
      >
        {t('common.navigation.logout')}
      </button>
    </div>
  );
}
