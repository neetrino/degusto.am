'use client';

import { ADMIN_TABLE_CHECKBOX, ADMIN_TABLE_TD_CHECK } from '../../constants/admin-table-classes';
import { useTranslation } from '../../../../lib/i18n-client';
import { convertPrice, CurrencyCode } from '../../../../lib/currency';
import { getStatusColor, getPaymentStatusColor } from '../utils/orderUtils';
import type { Order } from '../useOrders';

interface OrderRowProps {
  order: Order;
  selected: boolean;
  updatingStatus: boolean;
  updatingPaymentStatus: boolean;
  onToggleSelect: () => void;
  onViewDetails: () => void;
  onStatusChange: (newStatus: string) => void;
  onPaymentStatusChange: (newPaymentStatus: string) => void;
  formatCurrency: (amount: number, orderCurrency?: string, fromCurrency?: CurrencyCode) => string;
}

const selectClass =
  'inline-block w-auto max-w-full min-w-0 cursor-pointer rounded-md border-0 px-2 py-1.5 text-left text-xs font-medium leading-snug focus:outline-none focus:ring-2 focus:ring-blue-500';

export function OrderRow({
  order,
  selected,
  updatingStatus,
  updatingPaymentStatus,
  onToggleSelect,
  onViewDetails,
  onStatusChange,
  onPaymentStatusChange,
  formatCurrency,
}: OrderRowProps) {
  const { t } = useTranslation();

  const customerName =
    [order.customerFirstName, order.customerLastName].filter(Boolean).join(' ') ||
    t('admin.orders.unknownCustomer');
  const rowDetailsLabel = t('admin.orders.viewOrderDetails');

  const calculateTotalWithoutShipping = () => {
    if (order.subtotal !== undefined && order.discountAmount !== undefined && order.taxAmount !== undefined) {
      const subtotalAMD = convertPrice(order.subtotal, 'USD', 'AMD');
      const discountAMD = convertPrice(order.discountAmount, 'USD', 'AMD');
      const taxAMD = convertPrice(order.taxAmount, 'USD', 'AMD');
      const totalWithoutShippingAMD = subtotalAMD - discountAMD + taxAMD;
      return formatCurrency(totalWithoutShippingAMD, order.currency, 'AMD');
    }
    const totalAMD = convertPrice(order.total, 'USD', 'AMD');
    const shippingAMD = order.shippingAmount || 0;
    const totalWithoutShippingAMD = totalAMD - shippingAMD;
    return formatCurrency(totalWithoutShippingAMD, order.currency, 'AMD');
  };

  return (
    <tr
      className="cursor-pointer hover:bg-gray-50"
      onClick={onViewDetails}
      aria-label={rowDetailsLabel}
    >
      <td
        className={ADMIN_TABLE_TD_CHECK}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex min-w-0 justify-center">
          <input
            type="checkbox"
            className={ADMIN_TABLE_CHECKBOX}
            aria-label={t('admin.orders.selectOrder').replace('{number}', order.number)}
            checked={selected}
            onChange={onToggleSelect}
          />
        </div>
      </td>
      <td className="min-w-0 whitespace-nowrap px-3 py-2.5 text-left align-middle" title={order.number}>
        <span className="text-sm font-semibold text-gray-900">{order.number}</span>
      </td>
      <td className="min-w-[10rem] max-w-xs px-3 py-2.5 text-left align-middle sm:max-w-sm">
        <div className="min-w-0 max-w-full space-y-1">
          <div className="min-w-0 max-w-full truncate text-left text-sm font-medium text-gray-900" title={customerName}>
            {customerName}
          </div>
          <div
            className="min-w-0 max-w-full truncate text-left text-xs tabular-nums text-gray-600"
            title={order.customerPhone ?? undefined}
          >
            {order.customerPhone ? order.customerPhone : '—'}
          </div>
        </div>
      </td>
      <td
        className="min-w-0 whitespace-nowrap px-3 py-2.5 text-left align-middle text-sm font-semibold text-gray-900"
        title={calculateTotalWithoutShipping()}
      >
        {calculateTotalWithoutShipping()}
      </td>
      <td className="min-w-0 whitespace-nowrap px-3 py-2.5 text-center align-middle text-sm tabular-nums text-gray-600">
        {order.itemsCount}
      </td>
      <td
        className="min-w-0 px-3 py-2.5 text-left align-middle"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {updatingStatus ? (
          <div
            className="flex w-full min-w-0 items-center justify-center py-1"
            role="status"
            title={t('admin.orders.updating')}
            aria-label={t('admin.orders.updating')}
          >
            <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-gray-300 border-b-gray-900" />
          </div>
        ) : (
          <div className="inline-block min-w-0 max-w-full">
            <select
              value={order.status}
              onChange={(e) => onStatusChange(e.target.value)}
              className={`${selectClass} ${getStatusColor(order.status)}`}
            >
              <option value="pending">{t('admin.orders.pending')}</option>
              <option value="processing">{t('admin.orders.processing')}</option>
              <option value="completed">{t('admin.orders.completed')}</option>
              <option value="cancelled">{t('admin.orders.cancelled')}</option>
            </select>
          </div>
        )}
      </td>
      <td
        className="min-w-0 px-3 py-2.5 text-left align-middle"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {updatingPaymentStatus ? (
          <div
            className="flex w-full min-w-0 items-center justify-center py-1"
            role="status"
            title={t('admin.orders.updating')}
            aria-label={t('admin.orders.updating')}
          >
            <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-gray-300 border-b-gray-900" />
          </div>
        ) : (
          <div className="inline-block min-w-0 max-w-full">
            <select
              value={order.paymentStatus}
              onChange={(e) => onPaymentStatusChange(e.target.value)}
              className={`${selectClass} ${getPaymentStatusColor(order.paymentStatus)}`}
            >
              <option value="paid">{t('admin.orders.paid')}</option>
              <option value="pending">{t('admin.orders.pendingPayment')}</option>
              <option value="failed">{t('admin.orders.failed')}</option>
            </select>
          </div>
        )}
      </td>
      <td className="min-w-0 whitespace-nowrap px-3 py-2.5 text-left align-middle text-xs tabular-nums text-gray-600 sm:text-sm">
        {new Date(order.createdAt).toLocaleDateString(undefined, {
          year: '2-digit',
          month: 'numeric',
          day: 'numeric',
        })}
      </td>
    </tr>
  );
}
