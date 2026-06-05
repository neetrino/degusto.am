'use client';

import type { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import type { CheckoutFormData } from '../types';
import type { PaymentMethod, PaymentMethodId } from '../utils/payment-methods';
import {
  CHECKOUT_PAYMENT_OPTION,
  CHECKOUT_PAYMENT_OPTION_IDLE,
  CHECKOUT_PAYMENT_OPTION_SELECTED,
  CHECKOUT_TEXT_INK,
} from '../checkout-ui';
import { CheckoutPaymentMethodIcon } from './CheckoutPaymentMethodIcon';

type CheckoutPaymentMethodListProps = {
  paymentMethods: PaymentMethod[];
  paymentMethod: PaymentMethodId;
  register: UseFormRegister<CheckoutFormData>;
  setValue: UseFormSetValue<CheckoutFormData>;
  isSubmitting: boolean;
};

/** Borbor-style compact payment method picker. */
export function CheckoutPaymentMethodList({
  paymentMethods,
  paymentMethod,
  register,
  setValue,
  isSubmitting,
}: CheckoutPaymentMethodListProps) {
  const { onChange, ...paymentMethodField } = register('paymentMethod');

  return (
    <div className="space-y-3">
      {paymentMethods.map((method) => {
        const isSelected = paymentMethod === method.id;

        return (
          <label
            key={method.id}
            className={`${CHECKOUT_PAYMENT_OPTION} ${
              isSelected ? CHECKOUT_PAYMENT_OPTION_SELECTED : CHECKOUT_PAYMENT_OPTION_IDLE
            }`}
          >
            <input
              type="radio"
              {...paymentMethodField}
              value={method.id}
              checked={isSelected}
              onChange={(event) => {
                void onChange(event);
                setValue('paymentMethod', event.target.value as PaymentMethodId, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
              className="sr-only"
              disabled={isSubmitting}
            />
            <CheckoutPaymentMethodIcon iconKind={method.iconKind} methodId={method.id} />
            <span className={`min-w-0 flex-1 text-base font-semibold ${CHECKOUT_TEXT_INK}`}>
              {method.shortName}
            </span>
          </label>
        );
      })}
    </div>
  );
}
