'use client';

import { CHECKOUT_TEXT_INK_MUTED } from '../checkout-ui';

interface PaymentMethodLogoProps {
  paymentMethod: 'idram' | 'arca' | 'cash_on_delivery';
  logoErrors: Record<string, boolean>;
  onError: () => void;
  size?: 'small' | 'medium' | 'large';
}

const sizeClasses = {
  small: 'w-12 h-8',
  medium: 'w-16 h-10',
  large: 'w-20 h-12',
};

export function PaymentMethodLogo({
  paymentMethod,
  logoErrors,
  onError,
  size = 'medium',
}: PaymentMethodLogoProps) {
  const logoPath =
    paymentMethod === 'arca' ? '/assets/payments/arca.svg' : '/assets/payments/idram.svg';

  const altText = paymentMethod === 'arca' ? 'ArCa' : 'Idram';

  const frameClass = `${sizeClasses[size]} flex flex-shrink-0 items-center justify-center overflow-hidden rounded border border-[#F66812]/15 bg-white`;

  if (logoErrors[paymentMethod]) {
    return (
      <div className={frameClass}>
        <svg className={`h-6 w-6 ${CHECKOUT_TEXT_INK_MUTED}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={frameClass}>
      <img
        src={logoPath}
        alt={altText}
        className="h-full w-full object-contain p-1"
        loading="lazy"
        onError={onError}
      />
    </div>
  );
}
