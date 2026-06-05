'use client';

import { useTranslation } from '../../../../lib/i18n-client';
import { Card } from '@shop/ui';
import type { useOrders } from '../useOrders';

interface OrdersFiltersProps {
  statusFilter: string;
  paymentStatusFilter: string;
  searchQuery: string;
  updateMessage: { type: 'success' | 'error'; text: string } | null;
  setPage: (value: number | ((prev: number) => number)) => void;
  router: ReturnType<typeof useOrders>['router'];
  searchParams: ReturnType<typeof useOrders>['searchParams'];
  /** Defaults to `/supersudo/orders` (desktop admin). */
  basePath?: string;
}

export function OrdersFilters({
  statusFilter,
  paymentStatusFilter,
  searchQuery,
  updateMessage,
  setPage,
  router,
  searchParams,
  basePath = '/supersudo/orders',
}: OrdersFiltersProps) {
  const { t } = useTranslation();

  const buildOrdersUrl = (params: URLSearchParams) =>
    params.toString() ? `${basePath}?${params.toString()}` : basePath;
  const isMobileLayout = basePath.startsWith('/admin-mobile');
  const fieldClass = isMobileLayout
    ? 'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f66812]/20'
    : 'shrink-0 rounded-xl border border-[#dce3dd] bg-white px-3 py-3 text-sm text-[#314f3f] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1f6c4b]/20';
  const searchClass = isMobileLayout
    ? fieldClass
    : 'min-w-0 w-full flex-1 rounded-xl border border-[#dce3dd] bg-white px-3 py-3 text-sm text-[#314f3f] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1f6c4b]/20 basis-full sm:basis-0 sm:min-w-[12rem]';

  const handleStatusChange = (newStatus: string) => {
    setPage(1);
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (newStatus) {
      params.set('status', newStatus);
    } else {
      params.delete('status');
    }
    router.push(buildOrdersUrl(params), { scroll: false });
  };

  const handlePaymentStatusChange = (newPaymentStatus: string) => {
    setPage(1);
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (newPaymentStatus) {
      params.set('paymentStatus', newPaymentStatus);
    } else {
      params.delete('paymentStatus');
    }
    router.push(buildOrdersUrl(params), { scroll: false });
  };

  const handleSearchChange = (newSearch: string) => {
    setPage(1);
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (newSearch.trim()) {
      params.set('search', newSearch.trim());
    } else {
      params.delete('search');
    }
    router.push(buildOrdersUrl(params), { scroll: false });
  };

  return (
    <Card className={`w-full min-w-0 rounded-2xl border border-[#dfe6e0] bg-white p-4 shadow-[0_5px_14px_rgba(22,45,32,0.05)] ${isMobileLayout ? 'mb-4' : 'mb-6'}`}>
      <div
        className={
          isMobileLayout
            ? 'flex w-full min-w-0 flex-col gap-3'
            : 'flex w-full min-w-0 flex-wrap items-center gap-4'
        }
      >
        <select className={fieldClass} value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value)}
        >
          <option value="">{t('admin.orders.allStatuses')}</option>
          <option value="pending">{t('admin.orders.pending')}</option>
          <option value="processing">{t('admin.orders.processing')}</option>
          <option value="completed">{t('admin.orders.completed')}</option>
          <option value="cancelled">{t('admin.orders.cancelled')}</option>
        </select>
        <select className={fieldClass} value={paymentStatusFilter}
          onChange={(e) => handlePaymentStatusChange(e.target.value)}
        >
          <option value="">{t('admin.orders.allPaymentStatuses')}</option>
          <option value="paid">{t('admin.orders.paid')}</option>
          <option value="pending">{t('admin.orders.pendingPayment')}</option>
          <option value="failed">{t('admin.orders.failed')}</option>
        </select>
        <input
          type="text"
          placeholder={t('admin.orders.searchPlaceholder')}
          className={searchClass}
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
        <button
          type="button"
          className="shrink-0 rounded-xl bg-gradient-to-r from-[#0f5a3d] to-[#0f6b46] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(15,90,61,0.25)] hover:brightness-105"
        >
          Ֆիլտրել
        </button>
        {updateMessage && (
          <div
            className={`w-full min-w-0 rounded-md px-4 py-2 text-sm sm:w-auto ${
              updateMessage.type === 'success'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {updateMessage.text}
          </div>
        )}
      </div>
    </Card>
  );
}

