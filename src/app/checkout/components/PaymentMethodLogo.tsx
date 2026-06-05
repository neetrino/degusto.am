'use client';

import type { PaymentMethodId } from '../utils/payment-methods';
import { CheckoutPaymentMethodIcon } from './CheckoutPaymentMethodIcon';

interface PaymentMethodLogoProps {
  paymentMethod: PaymentMethodId;
  size?: 'sm' | 'md';
}

const SIZE_CLASS: Record<NonNullable<PaymentMethodLogoProps['size']>, string> = {
  sm: 'scale-90',
  md: '',
};

/** Payment brand icon for checkout modals (matches form row icons). */
export function PaymentMethodLogo({
  paymentMethod,
  size = 'md',
}: PaymentMethodLogoProps) {
  const iconKind =
    paymentMethod === 'cash_on_delivery'
      ? 'cash'
      : paymentMethod === 'idram'
        ? 'idram'
        : 'cardBrands';

  const isCardBrands = paymentMethod === 'arca';

  return (
    <div
      className={`flex h-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#F66812]/15 bg-white ${
        isCardBrands ? 'w-[6.75rem] px-2' : 'w-20'
      } ${SIZE_CLASS[size]}`}
    >
      <CheckoutPaymentMethodIcon iconKind={iconKind} methodId={paymentMethod} />
    </div>
  );
}
