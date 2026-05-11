'use client';

import { useTranslation } from '../../../../lib/i18n-client';
import { Card } from '@shop/ui';
import type { useOrders } from '../useOrders';

interface OrdersFiltersProps {
  statusFilter: string;
  paymentStatusFilter: string;
  searchQuery: string;
  totalCount: number;
  updateMessage: { type: 'success' | 'error'; text: string } | null;
  setPage: (value: number | ((prev: number) => number)) => void;
  router: ReturnType<typeof useOrders>['router'];
  searchParams: ReturnType<typeof useOrders>['searchParams'];
}

export function OrdersFilters({
  statusFilter,
  paymentStatusFilter,
  searchQuery,
  totalCount,
  updateMessage,
  setPage,
  router,
  searchParams,
}: OrdersFiltersProps) {
  const { t } = useTranslation();

  const handleStatusChange = (newStatus: string) => {
    setPage(1);
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (newStatus) {
      params.set('status', newStatus);
    } else {
      params.delete('status');
    }
    const newUrl = params.toString() ? `/supersudo/orders?${params.toString()}` : '/supersudo/orders';
    router.push(newUrl, { scroll: false });
  };

  const handlePaymentStatusChange = (newPaymentStatus: string) => {
    setPage(1);
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (newPaymentStatus) {
      params.set('paymentStatus', newPaymentStatus);
    } else {
      params.delete('paymentStatus');
    }
    const newUrl = params.toString() ? `/supersudo/orders?${params.toString()}` : '/supersudo/orders';
    router.push(newUrl, { scroll: false });
  };

  const handleSearchChange = (newSearch: string) => {
    setPage(1);
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (newSearch.trim()) {
      params.set('search', newSearch.trim());
    } else {
      params.delete('search');
    }
    const newUrl = params.toString() ? `/supersudo/orders?${params.toString()}` : '/supersudo/orders';
    router.push(newUrl, { scroll: false });
  };

  return (
    <Card className="mb-6 w-full min-w-0 p-4">
      <div className="flex w-full min-w-0 flex-wrap items-center gap-4">
        <select
          className="shrink-0 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value)}
        >
          <option value="">{t('admin.orders.allStatuses')}</option>
          <option value="pending">{t('admin.orders.pending')}</option>
          <option value="processing">{t('admin.orders.processing')}</option>
          <option value="completed">{t('admin.orders.completed')}</option>
          <option value="cancelled">{t('admin.orders.cancelled')}</option>
        </select>
        <select
          className="shrink-0 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={paymentStatusFilter}
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
          className="min-w-0 w-full flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 basis-full sm:basis-0 sm:min-w-[12rem]"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
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
      <div className="mt-3 border-t border-gray-200 pt-3 text-sm text-gray-700">
        {t('admin.orders.totalOrdersCount').replace('{count}', totalCount.toString())}
      </div>
    </Card>
  );
}

