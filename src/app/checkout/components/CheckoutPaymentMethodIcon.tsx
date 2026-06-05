'use client';

import type { PaymentMethodIconKind, PaymentMethodId } from '../utils/payment-methods';
import {
  CHECKOUT_CARD_BRAND_ICONS,
  CHECKOUT_PAYMENT_ASSETS,
} from '../constants/payment-assets';

type CheckoutPaymentMethodIconProps = {
  iconKind: PaymentMethodIconKind;
  methodId: PaymentMethodId;
  className?: string;
};

const CHECKOUT_PAYMENT_BADGE_CLASS = 'h-8 w-auto max-w-[6.5rem] shrink-0 object-contain';
const CHECKOUT_CARD_BRAND_BADGE_CLASS = 'h-8 w-auto max-w-[3.75rem] shrink-0 object-contain';

function resolveIconSlotClass(iconKind: PaymentMethodIconKind): string {
  if (iconKind === 'cardBrands') {
    return 'flex h-10 min-w-[11rem] shrink-0 items-center gap-1.5';
  }

  return 'flex h-10 shrink-0 items-center justify-center';
}

/** Borbor-style compact icons for checkout payment rows. */
export function CheckoutPaymentMethodIcon({
  iconKind,
  methodId,
  className = '',
}: CheckoutPaymentMethodIconProps) {
  if (iconKind === 'cardBrands') {
    return (
      <div className={`${resolveIconSlotClass(iconKind)} ${className}`} aria-hidden>
        {CHECKOUT_CARD_BRAND_ICONS.map((src) => (
          <img
            key={src}
            src={src}
            alt=""
            className={CHECKOUT_CARD_BRAND_BADGE_CLASS}
            loading="lazy"
          />
        ))}
      </div>
    );
  }

  const src =
    iconKind === 'cash' ? CHECKOUT_PAYMENT_ASSETS.cash : CHECKOUT_PAYMENT_ASSETS.idram;

  return (
    <span className={`${resolveIconSlotClass(iconKind)} ${className}`} aria-hidden>
      <img
        src={src}
        alt=""
        className={CHECKOUT_PAYMENT_BADGE_CLASS}
        loading="lazy"
        data-payment-icon={methodId}
      />
    </span>
  );
}
