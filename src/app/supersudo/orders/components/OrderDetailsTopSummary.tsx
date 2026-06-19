'use client';

import type { ReactNode } from 'react';
import { PaymentMethodLogo } from '@/app/checkout/components/PaymentMethodLogo';
import type { PaymentMethodId } from '@/app/checkout/utils/payment-methods';
import { formatPaymentMethodLabel } from '@/lib/orders/payment-method-label';
import { convertPrice, formatPriceInCurrency, type CurrencyCode } from '../../../../lib/currency';
import { useTranslation } from '../../../../lib/i18n-client';
import type { OrderDetails } from '../useOrders';
import { getPaymentStatusColor, getStatusColor } from '../utils/orderUtils';

interface OrderDetailsTopSummaryProps {
  orderDetails: OrderDetails;
  currency: string;
}

function toPaymentMethodId(method?: string | null): PaymentMethodId | null {
  const normalized = method?.trim().toLowerCase();
  if (normalized === 'idram' || normalized === 'arca' || normalized === 'cash_on_delivery') {
    return normalized;
  }
  return null;
}

function translateOrderStatus(status: string, t: (key: string) => string): string {
  const key = `admin.orders.${status}`;
  const translated = t(key);
  return translated === key ? status : translated;
}

function translatePaymentStatus(paymentStatus: string, t: (key: string) => string): string {
  if (paymentStatus === 'pending') {
    return t('admin.orders.pendingPayment');
  }
  const key = `admin.orders.${paymentStatus}`;
  const translated = t(key);
  return translated === key ? paymentStatus : translated;
}

function SummaryField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#6a7e71]">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export function OrderDetailsTopSummary({ orderDetails, currency }: OrderDetailsTopSummaryProps) {
  const { t } = useTranslation();

  const totals = orderDetails.totals;
  const totalDisplay = totals
    ? (() => {
        const subtotalAmd = convertPrice(totals.subtotal, 'USD', 'AMD');
        const discountAmd = convertPrice(totals.discount, 'USD', 'AMD');
        const bagFeeAmd = totals.bagFee ?? 0;
        const deliveryAmd = totals.shipping;
        const totalAmd = subtotalAmd - discountAmd + deliveryAmd + bagFeeAmd;
        const value = currency === 'AMD' ? totalAmd : convertPrice(totalAmd, 'AMD', currency as CurrencyCode);
        return formatPriceInCurrency(value, currency as CurrencyCode);
      })()
    : formatPriceInCurrency(orderDetails.total, currency as CurrencyCode);

  const paymentMethodRaw = orderDetails.payment?.method || orderDetails.payment?.provider || null;
  const paymentMethodId = toPaymentMethodId(paymentMethodRaw);
  const paymentMethodLabel = paymentMethodRaw ? formatPaymentMethodLabel(paymentMethodRaw) : '—';

  return (
    <section className="rounded-2xl border border-[#e2e8e3] bg-white p-4 shadow-[0_5px_14px_rgba(22,45,32,0.05)] sm:p-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <SummaryField label={t('admin.orders.total')}>
          <p className="text-2xl font-bold tabular-nums text-[#1d392b] sm:text-3xl">{totalDisplay}</p>
        </SummaryField>

        <SummaryField label={t('admin.orders.status')}>
          <span
            className={`inline-flex min-h-[2.5rem] min-w-[7.5rem] items-center rounded-lg border border-[#dde4de] bg-[#f7faf7] px-3 py-2 text-sm font-semibold capitalize ${getStatusColor(orderDetails.status)}`}
          >
            {translateOrderStatus(orderDetails.status, t)}
          </span>
        </SummaryField>

        <SummaryField label={t('admin.orders.orderDetails.method').replace(':', '')}>
          <div className="flex min-h-[2.5rem] items-center gap-2">
            {paymentMethodId ? (
              <PaymentMethodLogo paymentMethod={paymentMethodId} size="sm" />
            ) : null}
            <span className="text-sm font-medium capitalize text-[#1d392b]">{paymentMethodLabel}</span>
          </div>
        </SummaryField>

        <SummaryField label={t('admin.orders.payment')}>
          <span
            className={`inline-flex min-h-[2.5rem] min-w-[7.5rem] items-center rounded-lg border border-[#dde4de] px-3 py-2 text-sm font-semibold capitalize ${getPaymentStatusColor(orderDetails.paymentStatus)}`}
          >
            {translatePaymentStatus(orderDetails.paymentStatus, t)}
          </span>
        </SummaryField>
      </div>
    </section>
  );
}
