'use client';

import Link from 'next/link';
import { useTranslation } from '../../../lib/i18n-client';
import { formatCurrency } from '../../supersudo/analytics/utils';
import type { AnalyticsData } from '../../supersudo/analytics/types';
import { ADMIN_MOBILE_ORDERS_PATH } from '@/constants/admin-mobile-profile';
import { ADMIN_MOBILE_CARD_CLASS } from './admin-mobile-ui';

type AdminMobileStatsCardsProps = {
  analytics: AnalyticsData;
  totalUsers: number | null;
};

type StatCardProps = {
  label: string;
  value: string;
  href?: string;
  accentClass: string;
};

function StatCard({ label, value, href, accentClass }: StatCardProps) {
  const body = (
    <div className={`${ADMIN_MOBILE_CARD_CLASS} ${accentClass}`}>
      <p className="text-xs font-medium text-gray-600">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );

  if (!href) {
    return body;
  }

  return (
    <Link href={href} className="block active:opacity-90">
      {body}
    </Link>
  );
}

export function AdminMobileStatsCards({ analytics, totalUsers }: AdminMobileStatsCardsProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-4 grid grid-cols-2 gap-3">
      <StatCard
        label={t('admin.analytics.totalOrders')}
        value={String(analytics.orders.totalOrders)}
        href={`${ADMIN_MOBILE_ORDERS_PATH}`}
        accentClass="border-blue-100 bg-blue-50/60"
      />
      <StatCard
        label={t('admin.analytics.totalRevenue')}
        value={formatCurrency(analytics.orders.totalRevenue)}
        href={`${ADMIN_MOBILE_ORDERS_PATH}?paymentStatus=paid`}
        accentClass="border-green-100 bg-green-50/60"
      />
      <StatCard
        label={t('admin.analytics.totalUsers')}
        value={totalUsers !== null ? String(totalUsers) : '—'}
        accentClass="border-indigo-100 bg-indigo-50/60"
      />
      <StatCard
        label={t('admin.analytics.inventoryRisk')}
        value={String(analytics.inventory.outOfStockVariants)}
        accentClass="border-amber-100 bg-amber-50/60"
      />
    </div>
  );
}
