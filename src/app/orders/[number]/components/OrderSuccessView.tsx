'use client';

import Link from 'next/link';
import type { CurrencyCode } from '../../../../lib/currency';
import { useTranslation } from '../../../../lib/i18n-client';
import { SITE_CONTACT_PHONES } from '../../../../lib/site-contact';
import {
  ORDER_SUCCESS_HELP_BOX,
  ORDER_SUCCESS_ICON_SUCCESS,
  ORDER_SUCCESS_OUTLINE_BTN,
  ORDER_SUCCESS_PRIMARY_BTN,
} from '../order-success-ui';
import type { Order } from '../types';
import { HelpPhoneIcon, SuccessCheckIcon } from './order-success-icons';
import { OrderPurchaseHistory } from './OrderPurchaseHistory';

interface OrderSuccessViewProps {
  order: Order;
  currency: CurrencyCode;
}

export function OrderSuccessView({ order, currency }: OrderSuccessViewProps) {
  const { t } = useTranslation();
  const primaryPhone = SITE_CONTACT_PHONES[0];

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col items-center px-4 py-10 sm:py-14">
      <div className={ORDER_SUCCESS_ICON_SUCCESS}>
        <SuccessCheckIcon className="size-8" />
      </div>

      <h1 className="mt-6 text-center text-2xl font-bold text-[#1a1a1a] sm:text-[1.75rem]">
        {t('orders.success.title')}
      </h1>
      <p className="mt-3 text-center text-sm leading-relaxed text-[#666666] sm:text-base">
        {t('orders.success.subtitle')}
      </p>

      <OrderPurchaseHistory
        items={order.items}
        currency={currency}
        totals={order.totals}
        shippingMethod={order.shippingMethod}
      />

      <section className={`mt-6 w-full ${ORDER_SUCCESS_HELP_BOX}`}>
        <h2 className="text-base font-bold text-[#1a1a1a]">{t('orders.success.help.title')}</h2>
        <p className="mt-2 text-sm text-[#666666]">{t('orders.success.help.description')}</p>
        {primaryPhone ? (
          <a
            href={`tel:${primaryPhone.tel}`}
            className="mt-3 inline-flex items-center justify-center gap-2 text-base font-bold text-[#F66812] hover:text-[#e45f10]"
          >
            <HelpPhoneIcon className="size-[18px]" />
            {primaryPhone.display}
          </a>
        ) : null}
      </section>

      <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
        <Link href="/shop" className={ORDER_SUCCESS_PRIMARY_BTN}>
          {t('orders.success.buttons.orderAgain')}
          <span aria-hidden>→</span>
        </Link>
        <Link href="/" className={ORDER_SUCCESS_OUTLINE_BTN}>
          {t('orders.success.buttons.home')}
        </Link>
      </div>
    </div>
  );
}