'use client';

import { Card } from '@shop/ui';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../../lib/i18n-client';
import { formatCurrency } from '../utils/dashboardUtils';

interface Stats {
  users: { total: number };
  products: { total: number; lowStock: number };
  orders: { total: number; recent: number; pending: number };
  revenue: { total: number; currency: string };
}

interface StatsGridProps {
  stats: Stats | null;
  statsLoading: boolean;
}

export function StatsGrid({ stats, statsLoading }: StatsGridProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const cards = [
    {
      key: 'users',
      title: t('admin.dashboard.totalUsers'),
      value: stats?.users.total ?? 0,
      accent: 'from-[#ecf8f2] to-[#dff3ea]',
      iconWrap: 'bg-[#d9efe5] text-[#2e8e63]',
      delta: '+2',
      deltaColor: 'text-[#2c9a67]',
      onClick: () => router.push('/supersudo/users'),
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      ),
    },
    {
      key: 'products',
      title: t('admin.dashboard.totalProducts'),
      value: stats?.products.total ?? 0,
      accent: 'from-[#f4eefc] to-[#ebe2f8]',
      iconWrap: 'bg-[#eadff8] text-[#8a59c5]',
      delta: '+12',
      deltaColor: 'text-[#2c9a67]',
      onClick: () => router.push('/supersudo/products'),
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      ),
    },
    {
      key: 'orders',
      title: t('admin.dashboard.totalOrders'),
      value: stats?.orders.total ?? 0,
      accent: 'from-[#fdf6e8] to-[#f6edd8]',
      iconWrap: 'bg-[#f7ebca] text-[#b3822a]',
      delta: '+0',
      deltaColor: 'text-[#2c9a67]',
      onClick: () => router.push('/supersudo/orders'),
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      ),
    },
    {
      key: 'revenue',
      title: t('admin.dashboard.revenue'),
      value: stats ? formatCurrency(stats.revenue.total, stats.revenue.currency) : 'AMD 0',
      accent: 'from-[#fdf0eb] to-[#fbe6df]',
      iconWrap: 'bg-[#f8dfd6] text-[#c15c43]',
      delta: '0%',
      deltaColor: 'text-[#c15c43]',
      onClick: () => router.push('/supersudo/orders?filter=paid'),
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
    },
  ] as const;

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.key}
          className={`cursor-pointer rounded-2xl border border-[#e7e7e7] bg-gradient-to-br ${card.accent} p-5 shadow-[0_8px_24px_rgba(30,45,35,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(30,45,35,0.12)]`}
          onClick={card.onClick}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-[#46604f]">{card.title}</p>
              {statsLoading ? (
                <div className="mt-2 h-9 w-20 animate-pulse rounded bg-[#d9dfdb]" />
              ) : (
                <p className="mt-1 text-[2rem] font-bold leading-none text-[#1c2f24]">{card.value}</p>
              )}
              <p className={`mt-3 text-xs font-semibold ${card.deltaColor}`}>{card.delta} այս շաբաթ</p>
            </div>
            <div className={`grid h-14 w-14 place-items-center rounded-full ${card.iconWrap} shadow-inner`}>
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {card.icon}
              </svg>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

