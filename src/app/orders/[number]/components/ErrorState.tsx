'use client';

import Link from 'next/link';
import { useTranslation } from '../../../../lib/i18n-client';
import { BodyBackground } from '../../../../components/BodyBackground';
import {
  ORDER_SUCCESS_OUTLINE_BTN,
  ORDER_SUCCESS_PAGE_BG,
  ORDER_SUCCESS_PRIMARY_BTN,
} from '../order-success-ui';

interface ErrorStateProps {
  error: string | null;
}

export function ErrorState({ error }: ErrorStateProps) {
  const { t } = useTranslation();

  return (
    <>
      <BodyBackground color={ORDER_SUCCESS_PAGE_BG} />
      <div className="mx-auto flex w-full max-w-[560px] flex-col items-center px-4 py-10 text-center sm:py-14">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">{t('orders.notFound.title')}</h1>
        <p className="mt-3 text-sm text-[#666666]">{error || t('orders.notFound.description')}</p>
        <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
          <Link href="/shop" className={ORDER_SUCCESS_PRIMARY_BTN}>
            {t('orders.buttons.continueShopping')}
          </Link>
          <Link href="/" className={ORDER_SUCCESS_OUTLINE_BTN}>
            {t('orders.success.buttons.home')}
          </Link>
        </div>
      </div>
    </>
  );
}
