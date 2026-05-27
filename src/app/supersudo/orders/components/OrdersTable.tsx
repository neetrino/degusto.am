'use client';

import { useTranslation } from '../../../../lib/i18n-client';
import { Card } from '@shop/ui';
import { CurrencyCode } from '../../../../lib/currency';
import {
  ADMIN_TABLE,
  ADMIN_TABLE_CARD,
  ADMIN_TABLE_CHECKBOX,
  ADMIN_TABLE_FOOTER_ROUNDED_B,
  ADMIN_TABLE_OUTER_CLIP,
  ADMIN_TABLE_STATE_INSET,
  ADMIN_TABLE_TBODY,
  ADMIN_TABLE_THEAD,
  ADMIN_TABLE_TH,
  ADMIN_TABLE_TH_CENTER,
  ADMIN_TABLE_TH_CHECK,
  ADMIN_TABLE_TH_SORTABLE,
} from '../../constants/admin-table-classes';
import { OrderRow } from './OrderRow';
import { OrdersPagination } from './OrdersPagination';
import type { Order } from '../useOrders';

interface OrdersTableProps {
  orders: Order[];
  loading: boolean;
  selectedIds: Set<string>;
  updatingStatuses: Set<string>;
  updatingPaymentStatuses: Set<string>;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  meta: { total: number; page: number; limit: number; totalPages: number } | null;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onSort: (column: string) => void;
  onViewDetails: (orderId: string) => void;
  onStatusChange: (orderId: string, newStatus: string) => void;
  onPaymentStatusChange: (orderId: string, newPaymentStatus: string) => void;
  onPageChange: (newPage: number) => void;
  formatCurrency: (amount: number, orderCurrency?: string, fromCurrency?: CurrencyCode) => string;
}

function SortChevrons({
  active,
  direction,
}: {
  active: boolean;
  direction: 'asc' | 'desc';
}) {
  return (
    <span className="inline-flex shrink-0 flex-col leading-none">
      <svg
        className={`h-3 w-3 ${active && direction === 'asc' ? 'text-blue-600' : 'text-gray-400'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
          clipRule="evenodd"
        />
      </svg>
      <svg
        className={`-mt-0.5 h-3 w-3 ${active && direction === 'desc' ? 'text-blue-600' : 'text-gray-400'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  );
}

export function OrdersTable({
  orders,
  loading,
  selectedIds,
  updatingStatuses,
  updatingPaymentStatuses,
  sortBy,
  sortOrder,
  page,
  meta,
  onToggleSelect,
  onToggleSelectAll,
  onSort,
  onViewDetails,
  onStatusChange,
  onPaymentStatusChange,
  onPageChange,
  formatCurrency,
}: OrdersTableProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <Card className="rounded-2xl border border-[#dfe6e0] bg-white p-6 shadow-[0_5px_14px_rgba(22,45,32,0.05)]">
        <div className="py-8 text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-b-2 border-[#1f6c4b]" />
          <p className="text-sm text-[#5b6f63]">{t('admin.orders.loadingOrders')}</p>
        </div>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="rounded-2xl border border-[#dfe6e0] bg-white p-6 shadow-[0_5px_14px_rgba(22,45,32,0.05)]">
        <div className="py-8 text-center">
          <p className="text-sm text-[#5b6f63]">{t('admin.orders.noOrders')}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden rounded-2xl border border-[#dfe6e0] bg-white p-0 shadow-[0_8px_20px_rgba(22,45,32,0.07)]">
      <div className={ADMIN_TABLE_OUTER_CLIP}>
        <table className={ADMIN_TABLE}>
          <thead className="border-b border-[#15543a] bg-gradient-to-r from-[#0f5a3d] to-[#0b6a45]">
            <tr>
              <th className={ADMIN_TABLE_TH_CHECK}>
                <input
                  type="checkbox"
                  className={`${ADMIN_TABLE_CHECKBOX} border-white/60 bg-white/20`}
                  aria-label={t('admin.orders.selectAllOrders')}
                  checked={orders.length > 0 && orders.every((o) => selectedIds.has(o.id))}
                  onChange={onToggleSelectAll}
                />
              </th>
              <th className="min-w-0 whitespace-nowrap px-3 py-3 text-left align-middle text-xs font-semibold uppercase tracking-wide text-[#eef9f2]" title={t('admin.orders.orderNumber')}>
                <span className="whitespace-nowrap">{t('admin.orders.orderNumber')}</span>
              </th>
              <th
                className="min-w-[10rem] max-w-xs whitespace-nowrap px-3 py-3 text-left align-middle text-xs font-semibold uppercase tracking-wide text-[#eef9f2] sm:max-w-sm"
                title={t('admin.orders.customer')}
              >
                <span className="block min-w-0 truncate">{t('admin.orders.customer')}</span>
              </th>
              <th
                className="min-w-0 whitespace-nowrap cursor-pointer select-none px-3 py-3 text-left align-middle text-xs font-semibold uppercase tracking-wide text-[#eef9f2] hover:bg-white/10"
                title={t('admin.orders.total')}
                onClick={() => onSort('total')}
              >
                <div className="flex min-w-0 items-center justify-start gap-0.5">
                  <span className="min-w-0 truncate">{t('admin.orders.total')}</span>
                  <SortChevrons active={sortBy === 'total'} direction={sortOrder} />
                </div>
              </th>
              <th className="min-w-0 whitespace-nowrap px-3 py-3 text-center align-middle text-xs font-semibold uppercase tracking-wide text-[#eef9f2]" title={t('admin.orders.items')}>
                <span className="whitespace-nowrap">{t('admin.orders.itemsQtyHeader')}</span>
              </th>
              <th className="min-w-0 whitespace-nowrap px-3 py-3 text-left align-middle text-xs font-semibold uppercase tracking-wide text-[#eef9f2]" title={t('admin.orders.status')}>
                <span className="whitespace-nowrap">{t('admin.orders.status')}</span>
              </th>
              <th className="min-w-0 whitespace-nowrap px-3 py-3 text-left align-middle text-xs font-semibold uppercase tracking-wide text-[#eef9f2]" title={t('admin.orders.payment')}>
                <span className="whitespace-nowrap">{t('admin.orders.payment')}</span>
              </th>
              <th
                className="min-w-0 whitespace-nowrap cursor-pointer select-none px-3 py-3 text-left align-middle text-xs font-semibold uppercase tracking-wide text-[#eef9f2] hover:bg-white/10"
                title={t('admin.orders.date')}
                onClick={() => onSort('createdAt')}
              >
                <div className="flex min-w-0 items-center justify-start gap-0.5">
                  <span className="min-w-0 truncate">{t('admin.orders.date')}</span>
                  <SortChevrons active={sortBy === 'createdAt'} direction={sortOrder} />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edf1ee] bg-white [&_td]:align-middle">
            {orders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                selected={selectedIds.has(order.id)}
                updatingStatus={updatingStatuses.has(order.id)}
                updatingPaymentStatus={updatingPaymentStatuses.has(order.id)}
                onToggleSelect={() => onToggleSelect(order.id)}
                onViewDetails={() => onViewDetails(order.id)}
                onStatusChange={(newStatus) => onStatusChange(order.id, newStatus)}
                onPaymentStatusChange={(newPaymentStatus) => onPaymentStatusChange(order.id, newPaymentStatus)}
                formatCurrency={formatCurrency}
              />
            ))}
          </tbody>
        </table>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className={`${ADMIN_TABLE_FOOTER_ROUNDED_B} border-t border-[#e8ede8] bg-[#fbfdfb]`}>
          <OrdersPagination
            page={page}
            totalPages={meta.totalPages}
            total={meta.total}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </Card>
  );
}
