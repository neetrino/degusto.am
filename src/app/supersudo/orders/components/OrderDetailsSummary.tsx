'use client';

import { useTranslation } from '../../../../lib/i18n-client';
import type { OrderDetails } from '../useOrders';

interface OrderDetailsSummaryProps {
  orderDetails: OrderDetails;
}

export function OrderDetailsSummary({ orderDetails }: OrderDetailsSummaryProps) {
  const { t } = useTranslation();

  const customerName =
    [orderDetails.customer?.firstName, orderDetails.customer?.lastName].filter(Boolean).join(' ') ||
    t('admin.orders.unknownCustomer');

  return (
    <section className="h-full rounded-2xl border border-[#e2e8e3] bg-white p-4 shadow-[0_5px_14px_rgba(22,45,32,0.05)]">
      <h3 className="mb-3 text-sm font-semibold text-[#1d392b]">{t('admin.orders.orderDetails.customer')}</h3>
      <div className="space-y-2 text-sm text-[#3d5247]">
        <p className="font-semibold text-[#1d392b]">{customerName}</p>
        {orderDetails.customerPhone ? (
          <p className="tabular-nums">{orderDetails.customerPhone}</p>
        ) : null}
        {orderDetails.customerEmail ? (
          <p className="break-all">{orderDetails.customerEmail}</p>
        ) : null}
      </div>
    </section>
  );
}
