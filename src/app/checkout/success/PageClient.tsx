'use client';

import Link from 'next/link';
import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { BodyBackground } from '../../../components/BodyBackground';
import { resetCartBadgeState } from '../../../lib/cart/cart-events';
import { apiClient } from '../../../lib/api-client';
import { useTranslation } from '../../../lib/i18n-client';
import { formatOrderNumber } from '@/lib/orders/format-order-number';
import { clearGuestCart } from '../checkoutUtils';
import { CHECKOUT_COUPON_CODE_STORAGE_KEY } from '../checkout-coupon-client';
import { CHECKOUT_OUTLINE_BUTTON, CHECKOUT_PRIMARY_BUTTON, CHECKOUT_TEXT_INK_MUTED, CHECKOUT_TEXT_INK_TERTIARY } from '../checkout-ui';

function CheckoutSuccessContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order');

  useEffect(() => {
    if (!orderNumber) {
      return;
    }

    const resolvedOrderNumber = orderNumber;
    let cancelled = false;

    async function finalizePaidCheckout(): Promise<void> {
      try {
        const status = await apiClient.get<{
          orderNumber: string;
          paymentStatus: string;
        }>(`/api/v1/orders/${encodeURIComponent(resolvedOrderNumber)}/payment-status`);

        if (cancelled || status.paymentStatus !== 'paid') {
          return;
        }

        resetCartBadgeState();
        clearGuestCart();
        localStorage.removeItem(CHECKOUT_COUPON_CODE_STORAGE_KEY);
      } catch {
        // Success page stays usable even if status lookup fails.
      }
    }

    void finalizePaidCheckout();

    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  return (
    <>
      <BodyBackground color="#ffffff" />
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-[#1F2E1F]">{t('orders.success.title')}</h1>
        <p className={`mt-4 ${CHECKOUT_TEXT_INK_MUTED}`}>
          {orderNumber
            ? t('checkout.success.orderNumber').replace('{number}', formatOrderNumber(orderNumber))
            : t('checkout.success.generic')}
        </p>
        <p className={`mt-2 ${CHECKOUT_TEXT_INK_TERTIARY}`}>{t('checkout.success.contactNote')}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/shop"
            className={`rounded-xl px-5 py-2 text-sm font-medium text-white ${CHECKOUT_PRIMARY_BUTTON}`}
          >
            {t('checkout.buttons.continueShopping')}
          </Link>
          <Link
            href="/"
            className={`rounded-xl border bg-white px-5 py-2 text-sm font-medium ${CHECKOUT_OUTLINE_BUTTON}`}
          >
            {t('orders.success.buttons.home')}
          </Link>
        </div>
      </div>
    </>
  );
}

function CheckoutSuccessFallback() {
  return (
    <>
      <BodyBackground color="#ffffff" />
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-12 text-center">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-100" aria-hidden />
      </div>
    </>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<CheckoutSuccessFallback />}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
