'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BodyBackground } from '../../../components/BodyBackground';
import { useTranslation } from '../../../lib/i18n-client';
import { CHECKOUT_OUTLINE_BUTTON, CHECKOUT_PRIMARY_BUTTON, CHECKOUT_TEXT_INK_MUTED, CHECKOUT_TEXT_INK_TERTIARY } from '../checkout-ui';

export default function CheckoutSuccessPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order');

  return (
    <>
      <BodyBackground color="#ffffff" />
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-[#1F2E1F]">{t('orders.success.title')}</h1>
        <p className={`mt-4 ${CHECKOUT_TEXT_INK_MUTED}`}>
          {orderNumber
            ? t('checkout.success.orderNumber').replace('{number}', orderNumber)
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
