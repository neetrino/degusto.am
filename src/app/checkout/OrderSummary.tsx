'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@shop/ui';
import { COUPON_CODE_REGEX } from '@/lib/coupon-code-format';
import { useTranslation } from '../../lib/i18n-client';
import { formatPriceInCurrency } from '../../lib/currency';
import { CHECKOUT_COUPON_CODE_STORAGE_KEY, requestCheckoutCouponValidation } from './checkout-coupon-client';
import { CHECKOUT_PRIMARY_BUTTON, CHECKOUT_TEXT_LABEL, CHECKOUT_TEXT_VALUE } from './checkout-ui';

interface Cart {
  id: string;
  items: unknown[];
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
    discountDisplay: number;
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
  onCouponDiscountUsdChange: (discountUsd: number) => void;
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
  onCouponDiscountUsdChange,
}: OrderSummaryProps) {
  const { t } = useTranslation();
  const [promoInput, setPromoInput] = useState('');
  const [promoNotice, setPromoNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);

  const applyValidatedPromo = useCallback(
    async (rawCode: string, silent: boolean) => {
      if (!cart) {
        return;
      }
      const trimmed = rawCode.trim();
      if (!COUPON_CODE_REGEX.test(trimmed)) {
        onCouponDiscountUsdChange(0);
        localStorage.removeItem(CHECKOUT_COUPON_CODE_STORAGE_KEY);
        if (!silent) {
          setPromoNotice({ kind: 'error', text: t('common.cart.promoInvalid') });
        }
        return;
      }

      try {
        setApplyingPromo(true);
        const data = await requestCheckoutCouponValidation(trimmed, cart.totals.subtotal);
        setPromoInput(data.code);
        localStorage.setItem(CHECKOUT_COUPON_CODE_STORAGE_KEY, data.code);
        onCouponDiscountUsdChange(data.discountAmount);
        if (!silent) {
          setPromoNotice({
            kind: 'success',
            text: t('common.cart.promoApplied').replace('{code}', data.code),
          });
        } else {
          setPromoNotice(null);
        }
      } catch (err: unknown) {
        onCouponDiscountUsdChange(0);
        localStorage.removeItem(CHECKOUT_COUPON_CODE_STORAGE_KEY);
        if (!silent) {
          const message = err instanceof Error ? err.message : '';
          setPromoNotice({ kind: 'error', text: message || t('common.cart.promoInvalid') });
        } else {
          setPromoNotice(null);
        }
      } finally {
        setApplyingPromo(false);
      }
    },
    [cart, onCouponDiscountUsdChange, t]
  );

  useEffect(() => {
    if (!cart) {
      return;
    }
    const stored = localStorage.getItem(CHECKOUT_COUPON_CODE_STORAGE_KEY)?.trim();
    if (!stored) {
      return;
    }
    setPromoInput(stored);
    void applyValidatedPromo(stored, true);
  }, [cart?.totals.subtotal, applyValidatedPromo]);

  const handleApplyPromo = () => {
    void applyValidatedPromo(promoInput, false);
  };

  const hasDiscount = orderSummary.discountDisplay > 0;

  return (
    <div className="w-full self-start rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
      <h2 className="mb-5 text-lg font-semibold text-gray-900">{t('checkout.orderSummary')}</h2>

      <div className="mb-5 space-y-3 border-b border-gray-100 pb-5">
        <label htmlFor="checkout-promocode" className="mb-1.5 block text-sm font-medium text-gray-700">
          {t('common.cart.promocode')}
        </label>
        <div className="flex gap-2">
          <input
            id="checkout-promocode"
            type="text"
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value)}
            placeholder={t('common.cart.promocodePlaceholder')}
            disabled={isSubmitting || applyingPromo}
            className="h-10 min-w-0 flex-1 rounded-lg border border-gray-200 px-3 text-sm text-gray-900 outline-none ring-0 transition-colors focus:border-gray-400 disabled:bg-gray-50"
          />
          <Button
            type="button"
            variant="outline"
            size="md"
            className="shrink-0 border-gray-300 text-gray-800 hover:bg-gray-50"
            onClick={handleApplyPromo}
            disabled={isSubmitting || applyingPromo}
          >
            {applyingPromo ? t('common.cart.applyingPromo') : t('common.cart.applyPromo')}
          </Button>
        </div>
        {promoNotice ? (
          <p className={`text-xs ${promoNotice.kind === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {promoNotice.text}
          </p>
        ) : null}
      </div>

      <div className="mb-6 space-y-3 text-sm">
        <div className="flex justify-between gap-2">
          <span className={CHECKOUT_TEXT_LABEL}>{t('checkout.summary.subtotal')}</span>
          <span className={CHECKOUT_TEXT_VALUE}>
            {formatPriceInCurrency(orderSummary.subtotalDisplay, currency)}
          </span>
        </div>
        {hasDiscount ? (
          <div className="flex justify-between gap-2">
            <span className={CHECKOUT_TEXT_LABEL}>{t('common.cart.discount')}</span>
            <span className={`font-medium text-green-600 ${CHECKOUT_TEXT_VALUE}`}>
              −{formatPriceInCurrency(orderSummary.discountDisplay, currency)}
            </span>
          </div>
        ) : null}
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
        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between text-base font-semibold text-gray-900">
            <span>{t('checkout.summary.total')}</span>
            <span>{formatPriceInCurrency(orderSummary.totalDisplay, currency)}</span>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : null}

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
  );
}
