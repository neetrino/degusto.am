'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { BodyBackground } from '../../components/BodyBackground';
import { useTranslation } from '../../lib/i18n-client';
import { CHECKOUT_OUTLINE_BUTTON, CHECKOUT_PRIMARY_BUTTON, CHECKOUT_TEXT_INK_MUTED } from './checkout-ui';

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      // e.g. Sentry.captureException(error);
    }
  }, [error]);

  return (
    <>
      <BodyBackground color="#ffffff" />
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold text-[#1F2E1F]">{t('checkout.pageError.title')}</h2>
          <p className={`mb-4 ${CHECKOUT_TEXT_INK_MUTED}`}>{t('checkout.pageError.description')}</p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className={`rounded-xl px-4 py-2 text-sm font-medium text-white ${CHECKOUT_PRIMARY_BUTTON}`}
            >
              {t('common.buttons.tryAgain')}
            </button>
            <Link
              href="/shop"
              className={`rounded-xl border bg-white px-4 py-2 text-sm font-medium ${CHECKOUT_OUTLINE_BUTTON}`}
            >
              {t('common.navigation.shop')}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
