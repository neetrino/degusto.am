'use client';

import { useTranslation } from '../../../lib/i18n-client';
import { convertPrice, CurrencyCode } from '../../../lib/currency';
import { getPaymentStatusColor, getStatusColor } from '../../supersudo/orders/utils/orderUtils';
import type { Order } from '../../supersudo/orders/useOrders';
import { formatHydrationSafeDate } from '@/lib/format-date';
import { formatOrderNumber } from '@/lib/orders/format-order-number';
import { ADMIN_MOBILE_CARD_CLASS, ADMIN_MOBILE_FIELD_CLASS } from './admin-mobile-ui';

type AdminMobileOrderCardProps = {
  order: Order;
  updatingStatus: boolean;
  updatingPaymentStatus: boolean;
  onViewDetails: () => void;
  onStatusChange: (newStatus: string) => void;
  onPaymentStatusChange: (newPaymentStatus: string) => void;
  formatCurrency: (amount: number, orderCurrency?: string, fromCurrency?: CurrencyCode) => string;
};

const SELECT_CLASS = `${ADMIN_MOBILE_FIELD_CLASS} border-0 py-2 text-xs font-semibold`;

function formatOrderTotal(order: Order, formatCurrency: AdminMobileOrderCardProps['formatCurrency']): string {
  if (order.subtotal !== undefined && order.discountAmount !== undefined && order.taxAmount !== undefined) {
    const subtotalAmd = convertPrice(order.subtotal, 'USD', 'AMD');
    const discountAmd = convertPrice(order.discountAmount, 'USD', 'AMD');
    const taxAmd = convertPrice(order.taxAmount, 'USD', 'AMD');
    return formatCurrency(subtotalAmd - discountAmd + taxAmd, order.currency, 'AMD');
  }
  const totalAmd = convertPrice(order.total, 'USD', 'AMD');
  const shippingAmd = order.shippingAmount || 0;
  return formatCurrency(totalAmd - shippingAmd, order.currency, 'AMD');
}

export function AdminMobileOrderCard({
  order,
  updatingStatus,
  updatingPaymentStatus,
  onViewDetails,
  onStatusChange,
  onPaymentStatusChange,
  formatCurrency,
}: AdminMobileOrderCardProps) {
  const { t } = useTranslation();
  const customerName =
    [order.customerFirstName, order.customerLastName].filter(Boolean).join(' ') ||
    t('admin.orders.unknownCustomer');

  return (
    <article className={ADMIN_MOBILE_CARD_CLASS}>
      <button type="button" onClick={onViewDetails} className="w-full text-left active:opacity-80">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-gray-900">{formatOrderNumber(order.number)}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${getStatusColor(order.status)}`}
              >
                {order.status}
              </span>
            </div>
            <p className="truncate text-sm font-medium text-gray-800">{customerName}</p>
            {order.customerPhone ? (
              <span className="mt-0.5 block text-xs text-gray-500">{order.customerPhone}</span>
            ) : null}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-base font-bold text-gray-900">{formatOrderTotal(order, formatCurrency)}</p>
            <p className="text-xs text-gray-500">
              {formatHydrationSafeDate(order.createdAt)}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              {order.itemsCount} {t('admin.orders.items')}
            </p>
          </div>
        </div>
        <p className="mt-2 text-xs font-medium text-[#f66812]">{t('admin.orders.viewOrderDetailsShort')} →</p>
      </button>

      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
        <div>
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-gray-500">
            {t('admin.orders.status')}
          </span>
          {updatingStatus ? (
            <div className="flex h-10 items-center justify-center">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-b-[#f66812]" />
            </div>
          ) : (
            <select
              value={order.status}
              onChange={(event) => onStatusChange(event.target.value)}
              className={`${SELECT_CLASS} ${getStatusColor(order.status)}`}
              aria-label={t('admin.orders.status')}
            >
              <option value="pending">{t('admin.orders.pending')}</option>
              <option value="processing">{t('admin.orders.processing')}</option>
              <option value="completed">{t('admin.orders.completed')}</option>
              <option value="cancelled">{t('admin.orders.cancelled')}</option>
            </select>
          )}
        </div>
        <div>
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-gray-500">
            {t('admin.orders.payment')}
          </span>
          {updatingPaymentStatus ? (
            <div className="flex h-10 items-center justify-center">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-b-[#f66812]" />
            </div>
          ) : (
            <select
              value={order.paymentStatus}
              onChange={(event) => onPaymentStatusChange(event.target.value)}
              className={`${SELECT_CLASS} ${getPaymentStatusColor(order.paymentStatus)}`}
              aria-label={t('admin.orders.payment')}
            >
              <option value="paid">{t('admin.orders.paid')}</option>
              <option value="pending">{t('admin.orders.pendingPayment')}</option>
              <option value="failed">{t('admin.orders.failed')}</option>
            </select>
          )}
        </div>
      </div>
    </article>
  );
}
