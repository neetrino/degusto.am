'use client';

import { Card, Input } from '@shop/ui';
import type { UseFormRegister, UseFormSetValue, FieldErrors } from 'react-hook-form';
import type { CurrencyCode } from '../../../lib/currency';
import { useTranslation } from '../../../lib/i18n-client';
import type { CheckoutFormData } from '../types';
import type { CashChangeAmdDenomination } from '../constants/cash-denominations';
import { CashChangeDenominationPicker } from './CashChangeDenominationPicker';
import {
  CHECKOUT_CARD_FRAME,
  CHECKOUT_SECTION_TITLE_TEXT,
  CHECKOUT_TEXT_INK_MUTED,
} from '../checkout-ui';

interface CashChangeFromSectionProps {
  register: UseFormRegister<CheckoutFormData>;
  setValue: UseFormSetValue<CheckoutFormData>;
  errors: FieldErrors<CheckoutFormData>;
  isSubmitting: boolean;
  currency: CurrencyCode;
  cashChangeFrom: string | undefined;
}

export function CashChangeFromSection({
  register,
  setValue,
  errors,
  isSubmitting,
  currency,
  cashChangeFrom,
}: CashChangeFromSectionProps) {
  const { t } = useTranslation();
  const showAmdNotes = currency === 'AMD';

  const noteAlt = (amount: CashChangeAmdDenomination) =>
    t('checkout.cashDenominations.noteAlt').replace('{amount}', String(amount));

  const setCashFromNote = (amount: CashChangeAmdDenomination) => {
    setValue('cashChangeFrom', String(amount), { shouldValidate: true, shouldDirty: true });
  };

  const clearCashFromNote = () => {
    setValue('cashChangeFrom', '', { shouldValidate: true, shouldDirty: true });
  };

  return (
    <Card className={`p-6 ${CHECKOUT_CARD_FRAME}`}>
      <h2 className={`${CHECKOUT_SECTION_TITLE_TEXT} ${showAmdNotes ? 'mb-2' : 'mb-4'}`}>
        {t('checkout.form.cashChangeFrom')}
      </h2>
      {showAmdNotes ? (
        <>
          <p className={`mb-3 text-sm ${CHECKOUT_TEXT_INK_MUTED}`}>{t('checkout.cashDenominations.hint')}</p>
          <CashChangeDenominationPicker
            value={cashChangeFrom}
            onSelectAmount={setCashFromNote}
            onClearSelection={clearCashFromNote}
            disabled={isSubmitting}
            noteAlt={noteAlt}
            groupAriaLabel={t('checkout.cashDenominations.groupAria')}
          />
          {errors.cashChangeFrom?.message ? (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {errors.cashChangeFrom.message}
            </p>
          ) : null}
        </>
      ) : (
        <Input
          label={t('checkout.form.cashChangeFrom')}
          type="number"
          min="0"
          step="1"
          placeholder={t('checkout.placeholders.cashChangeFrom')}
          {...register('cashChangeFrom')}
          error={errors.cashChangeFrom?.message}
          disabled={isSubmitting}
        />
      )}
    </Card>
  );
}
