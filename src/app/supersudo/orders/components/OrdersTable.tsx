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
      <Card className={ADMIN_TABLE_STATE_INSET}>
        <div className="py-8 text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
          <p className="text-sm text-gray-600">{t('admin.orders.loadingOrders')}</p>
        </div>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className={ADMIN_TABLE_STATE_INSET}>
        <div className="py-8 text-center">
          <p className="text-sm text-gray-600">{t('admin.orders.noOrders')}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={ADMIN_TABLE_CARD}>
      <div className={ADMIN_TABLE_OUTER_CLIP}>
        <table className={ADMIN_TABLE}>
          <thead className={ADMIN_TABLE_THEAD}>
            <tr>
              <th className={ADMIN_TABLE_TH_CHECK}>
                <input
                  type="checkbox"
                  className={ADMIN_TABLE_CHECKBOX}
                  aria-label={t('admin.orders.selectAllOrders')}
                  checked={orders.length > 0 && orders.every((o) => selectedIds.has(o.id))}
                  onChange={onToggleSelectAll}
                />
              </th>
              <th className={ADMIN_TABLE_TH} title={t('admin.orders.orderNumber')}>
                <span className="whitespace-nowrap">{t('admin.orders.orderNumber')}</span>
              </th>
              <th
                className={`${ADMIN_TABLE_TH} min-w-[10rem] max-w-xs sm:max-w-sm`}
                title={t('admin.orders.customer')}
              >
                <span className="block min-w-0 truncate">{t('admin.orders.customer')}</span>
              </th>
              <th
                className={ADMIN_TABLE_TH_SORTABLE}
                title={t('admin.orders.total')}
                onClick={() => onSort('total')}
              >
                <div className="flex min-w-0 items-center justify-start gap-0.5">
                  <span className="min-w-0 truncate">{t('admin.orders.total')}</span>
                  <SortChevrons active={sortBy === 'total'} direction={sortOrder} />
                </div>
              </th>
              <th className={ADMIN_TABLE_TH_CENTER} title={t('admin.orders.items')}>
                <span className="whitespace-nowrap">{t('admin.orders.itemsQtyHeader')}</span>
              </th>
              <th className={ADMIN_TABLE_TH} title={t('admin.orders.status')}>
                <span className="whitespace-nowrap">{t('admin.orders.status')}</span>
              </th>
              <th className={ADMIN_TABLE_TH} title={t('admin.orders.payment')}>
                <span className="whitespace-nowrap">{t('admin.orders.payment')}</span>
              </th>
              <th
                className={ADMIN_TABLE_TH_SORTABLE}
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
          <tbody className={ADMIN_TABLE_TBODY}>
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
        <div className={ADMIN_TABLE_FOOTER_ROUNDED_B}>
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
