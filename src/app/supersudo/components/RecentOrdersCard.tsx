'use client';

import { Card, Button } from '@shop/ui';
import { useRouter } from 'next/navigation';
import { formatOrderNumber } from '@/lib/orders/format-order-number';
import { useTranslation } from '../../../lib/i18n-client';
import { formatCurrency, formatDate } from '../utils/dashboardUtils';

interface RecentOrder {
  id: string;
  number: string;
  status: string;
  paymentStatus: string;
  total: number;
  currency: string;
  customerEmail?: string;
  customerPhone?: string;
  itemsCount: number;
  createdAt: string;
}

interface RecentOrdersCardProps {
  recentOrders: RecentOrder[];
  recentOrdersLoading: boolean;
}

export function RecentOrdersCard({ recentOrders, recentOrdersLoading }: RecentOrdersCardProps) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Card className="rounded-2xl border border-[#e3e8e3] bg-[#f9fcf9] p-5 shadow-[0_8px_24px_rgba(24,46,34,0.06)]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-[#1b3a2b]">
          <span className="text-[#2b8d64]">❦</span>
          {t('admin.dashboard.recentOrders')}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-[#2c5743] transition-colors hover:bg-[#e9f3ec] hover:text-[#173a2a]"
          onClick={() => router.push('/supersudo/orders')}
        >
          {t('admin.dashboard.viewAll')}
        </Button>
      </div>
      <div className="space-y-4">
        {recentOrdersLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 rounded-xl bg-[#e1e7e2]" />
              </div>
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-600">
            <p>{t('admin.dashboard.noRecentOrders')}</p>
          </div>
        ) : (
          recentOrders.map((order) => (
            <div
              key={order.id}
              className="cursor-pointer rounded-xl border border-[#e1e6e1] bg-white p-4 transition-colors hover:border-[#cadacb] hover:bg-[#fefefe]"
              onClick={() => router.push(`/supersudo/orders?search=${order.number}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex flex-1 items-start gap-3">
                  <div className="mt-1 grid h-9 w-9 place-items-center rounded-full bg-[#e9f3ec] text-[#2b8d64]">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
                    </svg>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#1f2c24]">{formatOrderNumber(order.number)}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          order.paymentStatus === 'paid'
                            ? 'bg-[#dff4e5] text-[#267e56]'
                            : order.paymentStatus === 'pending'
                            ? 'bg-[#f9e8bd] text-[#9a6c1d]'
                            : 'bg-[#ececec] text-[#666]'
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </div>
                    <p className="text-xs text-[#53685b]">
                      {order.customerEmail || order.customerPhone || t('admin.dashboard.guest')}
                    </p>
                    <p className="mt-1 text-xs text-[#72857a]">
                      {order.itemsCount === 1
                        ? t('admin.dashboard.items').replace('{count}', order.itemsCount.toString())
                        : t('admin.dashboard.itemsPlural').replace('{count}', order.itemsCount.toString())}{' '}
                      • {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#27372e]">
                    {formatCurrency(order.total, order.currency)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
