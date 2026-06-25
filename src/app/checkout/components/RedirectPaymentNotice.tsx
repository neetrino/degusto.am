'use client';

import { useTranslation } from '../../../lib/i18n-client';
import { CHECKOUT_TEXT_INK } from '../checkout-ui';
import type { PaymentMethodId } from '../utils/payment-methods';

type RedirectPaymentNoticeProps = {
  paymentMethod: Extract<PaymentMethodId, 'arca' | 'idram'>;
};

/** Explains that card/wallet payment happens on the provider page (no card form on our site). */
export function RedirectPaymentNotice({ paymentMethod }: RedirectPaymentNoticeProps) {
  const { t } = useTranslation();
  const messageKey =
    paymentMethod === 'arca'
      ? 'checkout.messages.arcaRedirectInfo'
      : 'checkout.messages.idramRedirectInfo';

  return (
    <div className="mb-6 mt-6 rounded-lg border border-[#F66812]/20 bg-[#F66812]/[0.06] p-4">
      <p className={`text-sm ${CHECKOUT_TEXT_INK}`}>{t(messageKey)}</p>
    </div>
  );
}
