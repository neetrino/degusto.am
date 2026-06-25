'use client';

import { useTranslation } from '../../../../lib/i18n-client';
import { convertPrice, formatPriceInCurrency, type CurrencyCode } from '../../../../lib/currency';
import type { OrderDetails } from '../useOrders';

interface OrderDetailsTotalsProps {
  orderDetails: OrderDetails;
  currency: string;
  formatCurrency: (amount: number, orderCurrency?: string, fromCurrency?: CurrencyCode) => string;
}

export function OrderDetailsTotals({
  orderDetails,
  currency,
  formatCurrency,
}: OrderDetailsTotalsProps) {
  const { t } = useTranslation();

  if (!orderDetails.totals) {
    return null;
  }

  const totalDisplay = (() => {
    const subtotalAmd = convertPrice(orderDetails.totals.subtotal, 'USD', 'AMD');
    const discountAmd = convertPrice(orderDetails.totals.discount, 'USD', 'AMD');
    const shippingAmd = orderDetails.totals.shipping;
    const bagFeeAmd = orderDetails.totals.bagFee ?? 0;
    const deliveryAmd = Math.max(0, shippingAmd - bagFeeAmd);
    const totalAmd = subtotalAmd - discountAmd + deliveryAmd + bagFeeAmd;
    const value = currency === 'AMD' ? totalAmd : convertPrice(totalAmd, 'AMD', currency as CurrencyCode);
    return formatPriceInCurrency(value, currency as CurrencyCode);
  })();
  const bagFeeAmd = orderDetails.totals.bagFee ?? 0;
  const shippingAmd = orderDetails.totals.shipping;
  const deliveryAmd = Math.max(0, shippingAmd - bagFeeAmd);

  const shippingLabel =
    orderDetails.shippingMethod === 'pickup'
      ? t('checkout.shipping.freePickup')
      : `${formatCurrency(deliveryAmd, orderDetails.totals.currency || 'AMD', 'AMD')}${
          orderDetails.shippingAddress?.city ? ` (${orderDetails.shippingAddress.city})` : ''
        }`;

  return (
    <div className="border-t border-[#edf1ee] px-4 py-4 sm:px-5">
      <div className="ml-auto w-full max-w-md space-y-2">
        <p className="text-right text-xs font-semibold uppercase tracking-wide text-[#9aa89e]">
          {t('orders.orderSummary.title')}
        </p>
        <div className="flex items-center justify-between text-sm text-[#5b6f63]">
          <span>{t('orders.orderSummary.subtotal')}</span>
          <span className="tabular-nums">
            {formatCurrency(
              orderDetails.totals.subtotal,
              (orderDetails.totals.currency || 'AMD') as CurrencyCode,
              'USD'
            )}
          </span>
        </div>
        {orderDetails.totals.discount > 0 ? (
          <div className="flex items-center justify-between text-sm text-[#5b6f63]">
            <span>{t('orders.orderSummary.discount')}</span>
            <span className="tabular-nums">
              -
              {formatCurrency(
                orderDetails.totals.discount,
                (orderDetails.totals.currency || 'AMD') as CurrencyCode,
                'USD'
              )}
            </span>
          </div>
        ) : null}
        <div className="flex items-center justify-between text-sm text-[#5b6f63]">
          <span>{t('orders.orderSummary.shipping')}</span>
          <span className="tabular-nums">{shippingLabel}</span>
        </div>
        {bagFeeAmd > 0 ? (
          <div className="flex items-center justify-between text-sm text-[#5b6f63]">
            <span>{t('checkout.summary.bagFee')}</span>
            <span className="tabular-nums">
              {formatCurrency(bagFeeAmd, orderDetails.totals.currency || 'AMD', 'AMD')}
            </span>
          </div>
        ) : null}
        <div className="flex items-center justify-between rounded-lg bg-[#f3f5f4] px-3 py-2.5 text-base font-bold text-[#1d392b]">
          <span>{t('orders.orderSummary.total')}</span>
          <span className="tabular-nums">{totalDisplay}</span>
        </div>
      </div>
    </div>
  );
}
