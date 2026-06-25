'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BodyBackground } from '../../../components/BodyBackground';
import { useTranslation } from '../../../lib/i18n-client';
import { formatOrderNumber } from '@/lib/orders/format-order-number';
import {
  CHECKOUT_OUTLINE_BUTTON,
  CHECKOUT_PRIMARY_BUTTON,
  CHECKOUT_TEXT_INK_MUTED,
} from '../checkout-ui';

function CheckoutErrorContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order');

  return (
    <>
      <BodyBackground color="#ffffff" />
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-[#1F2E1F]">{t('checkout.error.title')}</h1>
        <p className={`mt-4 ${CHECKOUT_TEXT_INK_MUTED}`}>
          {orderNumber
            ? t('checkout.error.orderNumber').replace('{number}', formatOrderNumber(orderNumber))
            : t('checkout.error.generic')}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/checkout"
            className={`rounded-xl px-5 py-2 text-sm font-medium text-white ${CHECKOUT_PRIMARY_BUTTON}`}
          >
            {t('checkout.error.tryAgain')}
          </Link>
          <Link
            href="/shop"
            className={`rounded-xl border bg-white px-5 py-2 text-sm font-medium ${CHECKOUT_OUTLINE_BUTTON}`}
          >
            {t('checkout.buttons.continueShopping')}
          </Link>
        </div>
      </div>
    </>
  );
}

function CheckoutErrorFallback() {
  return (
    <>
      <BodyBackground color="#ffffff" />
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-12 text-center">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-100" aria-hidden />
      </div>
    </>
  );
}

export default function CheckoutErrorPage() {
  return (
    <Suspense fallback={<CheckoutErrorFallback />}>
      <CheckoutErrorContent />
    </Suspense>
  );
}
