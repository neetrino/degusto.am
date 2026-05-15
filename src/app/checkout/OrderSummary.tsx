'use client';

import { Button } from '@shop/ui';
import { useTranslation } from '../../lib/i18n-client';
import { formatPriceInCurrency } from '../../lib/currency';
import { CHECKOUT_PRIMARY_BUTTON, CHECKOUT_TEXT_LABEL, CHECKOUT_TEXT_VALUE } from './checkout-ui';

interface Cart {
  id: string;
  items: any[];
  totals: {
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    total: number;
    currency: string;
  };
  itemsCount: number;
}

interface OrderSummaryProps {
  cart: Cart | null;
  orderSummary: {
    subtotalDisplay: number;
    bagFeeDisplay: number;
    shippingDisplay: number;
    totalDisplay: number;
  };
  currency: 'USD' | 'AMD' | 'EUR' | 'RUB' | 'GEL';
  shippingMethod: 'pickup' | 'delivery';
  shippingCity: string | undefined;
  loadingDeliveryPrice: boolean;
  deliveryPrice: number | null;
  bagFee: number;
  deliveryUnavailable: boolean;
  error: string | null;
  isSubmitting: boolean;
  onPlaceOrder: (e?: React.FormEvent) => void;
}

export function OrderSummary({
  cart,
  orderSummary,
  currency,
  shippingMethod,
  shippingCity,
  loadingDeliveryPrice,
  deliveryPrice,
  bagFee,
  deliveryUnavailable,
  error,
  isSubmitting,
  onPlaceOrder,
}: OrderSummaryProps) {
  const { t } = useTranslation();

  return (
    <div className="relative isolate w-full self-start lg:sticky lg:top-24">
      <div
        aria-hidden
        className="cart-order-summary-ticket-clip cart-order-summary-ticket-glow-underlay"
      />
      <div className="cart-order-summary-ticket-clip relative z-[1] rounded-t-2xl border-x border-t border-[#F66812]/20 bg-white px-6 pb-8 pt-6 drop-shadow-sm">
        <h2 className="mb-6 text-2xl font-bold text-[#1F2E1F]">{t('checkout.orderSummary')}</h2>
        <div className="mb-6 space-y-4">
          <div className="flex justify-between gap-2">
            <span className={CHECKOUT_TEXT_LABEL}>{t('checkout.summary.subtotal')}</span>
            <span className={CHECKOUT_TEXT_VALUE}>
              {formatPriceInCurrency(orderSummary.subtotalDisplay, currency)}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className={CHECKOUT_TEXT_LABEL}>{t('checkout.summary.shipping')}</span>
            <span className={`text-right ${CHECKOUT_TEXT_VALUE}`}>
              {shippingMethod === 'pickup'
                ? t('checkout.shipping.freePickup')
                : loadingDeliveryPrice
                  ? t('checkout.shipping.loading')
                  : deliveryUnavailable
                    ? t('checkout.errors.deliveryOnlyYerevan')
                    : deliveryPrice !== null
                      ? formatPriceInCurrency(orderSummary.shippingDisplay, currency) +
                        (shippingCity ? ` (${shippingCity})` : ` (${t('checkout.shipping.delivery')})`)
                      : t('checkout.shipping.enterCity')}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className={CHECKOUT_TEXT_LABEL}>{t('checkout.summary.bagFee')}</span>
            <span className={CHECKOUT_TEXT_VALUE}>
              {shippingMethod === 'delivery'
                ? formatPriceInCurrency(orderSummary.bagFeeDisplay, currency)
                : formatPriceInCurrency(0, currency)}
            </span>
          </div>
          <div className="border-t border-[#F66812]/15 pt-4">
            <div className="flex justify-between text-xl font-bold text-[#1F2E1F]">
              <span>{t('checkout.summary.total')}</span>
              <span>{formatPriceInCurrency(orderSummary.totalDisplay, currency)}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          className={`w-full ${CHECKOUT_PRIMARY_BUTTON}`}
          size="lg"
          disabled={isSubmitting}
          onClick={onPlaceOrder}
        >
          {isSubmitting ? t('checkout.buttons.processing') : t('checkout.buttons.placeOrder')}
        </Button>
      </div>
    </div>
  );
}

