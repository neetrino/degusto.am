'use client';

import { useTranslation } from '../../../lib/i18n-client';
import { formatPriceInCurrency } from '../../../lib/currency';
import { CHECKOUT_TEXT_LABEL, CHECKOUT_TEXT_VALUE } from '../checkout-ui';
import { Cart } from '../types';

interface OrderSummaryModalProps {
  cart: Cart | null;
  orderSummary: {
    subtotalDisplay: number;
    bagFeeDisplay: number;
    shippingDisplay: number;
    totalDisplay: number;
  };
  currency: 'USD' | 'AMD' | 'EUR' | 'RUB' | 'GEL';
  shippingMethod: 'pickup' | 'delivery';
  shippingCity?: string;
  loadingDeliveryPrice: boolean;
  deliveryPrice: number | null;
  bagFee: number;
  deliveryUnavailable: boolean;
}

export function OrderSummaryModal({
  cart,
  orderSummary,
  currency,
  shippingMethod,
  shippingCity,
  loadingDeliveryPrice,
  deliveryPrice,
  bagFee,
  deliveryUnavailable,
}: OrderSummaryModalProps) {
  const { t } = useTranslation();

  if (!cart) {
    return null;
  }

  const shippingDisplay = shippingMethod === 'pickup' 
    ? t('checkout.shipping.freePickup')
    : loadingDeliveryPrice
      ? t('checkout.shipping.loading')
      : deliveryUnavailable
        ? t('checkout.errors.deliveryOnlyYerevan')
        : deliveryPrice !== null
        ? formatPriceInCurrency(orderSummary.shippingDisplay, currency) + 
          (shippingCity ? ` (${shippingCity})` : ` (${t('checkout.shipping.delivery')})`)
        : t('checkout.shipping.enterCity');

  return (
    <div className="space-y-2 rounded-xl border border-[#F66812]/15 bg-[#F66812]/[0.05] p-4">
      <div className="flex justify-between gap-2 text-sm">
        <span className={CHECKOUT_TEXT_LABEL}>{t('checkout.summary.items')}:</span>
        <span className={CHECKOUT_TEXT_VALUE}>{cart.itemsCount}</span>
      </div>
      <div className="flex justify-between gap-2 text-sm">
        <span className={CHECKOUT_TEXT_LABEL}>{t('checkout.summary.subtotal')}:</span>
        <span className={CHECKOUT_TEXT_VALUE}>
          {formatPriceInCurrency(orderSummary.subtotalDisplay, currency)}
        </span>
      </div>
      <div className="flex justify-between gap-2 text-sm">
        <span className={CHECKOUT_TEXT_LABEL}>{t('checkout.summary.shipping')}:</span>
        <span className={`text-right ${CHECKOUT_TEXT_VALUE}`}>{shippingDisplay}</span>
      </div>
      <div className="flex justify-between gap-2 text-sm">
        <span className={CHECKOUT_TEXT_LABEL}>{t('checkout.summary.bagFee')}:</span>
        <span className={CHECKOUT_TEXT_VALUE}>
          {shippingMethod === 'delivery'
            ? formatPriceInCurrency(orderSummary.bagFeeDisplay, currency)
            : formatPriceInCurrency(0, currency)}
        </span>
      </div>
      <div className="mt-2 border-t border-[#F66812]/15 pt-2">
        <div className="flex justify-between">
          <span className="font-semibold text-[#1F2E1F]">{t('checkout.summary.total')}:</span>
          <span className="font-bold text-[#F66812]">
            {formatPriceInCurrency(orderSummary.totalDisplay, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}

