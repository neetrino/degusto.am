'use client';

import { Card, Input } from '@shop/ui';
import type { UseFormRegister, UseFormSetValue, FieldErrors } from 'react-hook-form';
import type { CurrencyCode } from '../../lib/currency';
import { useTranslation } from '../../lib/i18n-client';
import { CashChangeFromSection } from './components/CashChangeFromSection';
import { CheckoutPaymentMethodList } from './components/CheckoutPaymentMethodList';
import { CheckoutOrderItems } from './components/CheckoutOrderItems';
import {
  CHECKOUT_CARD_FRAME,
  CHECKOUT_FORM_COLUMN_CLASS,
  CHECKOUT_SECTION_TITLE,
  CHECKOUT_SECTION_TITLE_TEXT,
  CHECKOUT_TEXT_INK,
} from './checkout-ui';
import type { PaymentMethod, PaymentMethodId } from './utils/payment-methods';
import { CheckoutFormData } from './types';
import type { Cart } from './types';

interface CheckoutFormProps {
  cart: Cart;
  register: UseFormRegister<CheckoutFormData>;
  setValue: UseFormSetValue<CheckoutFormData>;
  errors: FieldErrors<CheckoutFormData>;
  isSubmitting: boolean;
  shippingMethod: 'pickup' | 'delivery';
  paymentMethod: PaymentMethodId;
  paymentMethods: PaymentMethod[];
  currency: CurrencyCode;
  cashChangeFrom: string | undefined;
  deliveryCities: string[];
  onRemoveCartItem: (itemId: string) => void;
}

export function CheckoutForm({
  cart,
  register,
  setValue,
  errors,
  isSubmitting,
  shippingMethod,
  paymentMethod,
  paymentMethods,
  currency,
  cashChangeFrom,
  deliveryCities,
  onRemoveCartItem,
}: CheckoutFormProps) {
  const { t } = useTranslation();

  return (
    <div className={`${CHECKOUT_FORM_COLUMN_CLASS} space-y-6`}>
      <CheckoutOrderItems
        cart={cart}
        isSubmitting={isSubmitting}
        onRemoveItem={onRemoveCartItem}
      />

      {/* Contact Information */}
      <Card className={`p-6 ${CHECKOUT_CARD_FRAME}`}>
        <h2 className={CHECKOUT_SECTION_TITLE}>{t('checkout.contactInformation')}</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('checkout.form.firstName')}
              type="text"
              {...register('firstName')}
              error={errors.firstName?.message}
              disabled={isSubmitting}
            />
            <Input
              label={t('checkout.form.lastName')}
              type="text"
              {...register('lastName')}
              error={errors.lastName?.message}
              disabled={isSubmitting}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('checkout.form.email')}
              type="email"
              {...register('email')}
              error={errors.email?.message}
              disabled={isSubmitting}
            />
            <Input
              label={t('checkout.form.phone')}
              type="tel"
              placeholder={t('checkout.placeholders.phone')}
              {...register('phone')}
              error={errors.phone?.message}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </Card>

      <input type="hidden" {...register('shippingMethod')} value="delivery" />

      {/* Shipping Address - Only show for delivery */}
      {shippingMethod === 'delivery' && (
        <Card className={`p-6 ${CHECKOUT_CARD_FRAME}`} data-shipping-section>
          <h2 className={CHECKOUT_SECTION_TITLE}>{t('checkout.shippingAddress')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="shippingCity" className={`mb-1 block text-sm font-medium ${CHECKOUT_TEXT_INK}`}>
                {t('checkout.form.city')}
              </label>
              <select
                id="shippingCity"
                {...register('shippingCity')}
                className={`w-full rounded-lg border bg-white px-3 py-2 text-sm ${CHECKOUT_TEXT_INK} focus:border-transparent focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                  errors.shippingCity
                    ? 'border-red-400 focus:ring-red-500'
                    : 'border-[#F66812]/25 focus:ring-[#F66812]'
                }`}
                disabled={isSubmitting || deliveryCities.length === 0}
              >
                <option value="">{t('checkout.placeholders.city')}</option>
                {deliveryCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              {errors.shippingCity?.message ? (
                <p className="mt-1 text-sm text-red-600">{errors.shippingCity.message}</p>
              ) : null}
            </div>
            <div>
              <Input
                label={t('checkout.form.address')}
                type="text"
                placeholder={t('checkout.placeholders.address')}
                {...register('shippingAddress')}
                error={errors.shippingAddress?.message}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Payment Method */}
      <Card className={`p-6 ${CHECKOUT_CARD_FRAME}`}>
        <h2 className={CHECKOUT_SECTION_TITLE}>{t('checkout.paymentMethod')}</h2>
        {errors.paymentMethod && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errors.paymentMethod.message}</p>
          </div>
        )}
        <CheckoutPaymentMethodList
          paymentMethods={paymentMethods}
          paymentMethod={paymentMethod}
          register={register}
          setValue={setValue}
          isSubmitting={isSubmitting}
        />
      </Card>

      {paymentMethod === 'cash_on_delivery' && (
        <CashChangeFromSection
          register={register}
          setValue={setValue}
          errors={errors}
          isSubmitting={isSubmitting}
          currency={currency}
          cashChangeFrom={cashChangeFrom}
        />
      )}

      <Card className={`p-6 ${CHECKOUT_CARD_FRAME}`}>
        <h2 className={`${CHECKOUT_SECTION_TITLE_TEXT} mb-4`}>{t('checkout.form.orderNotes')}</h2>
        <textarea
          {...register('orderNotes')}
          rows={4}
          maxLength={500}
          placeholder={t('checkout.placeholders.orderNotes')}
          className={`w-full rounded-lg border border-[#F66812]/25 px-3 py-2 text-sm ${CHECKOUT_TEXT_INK} focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#F66812]`}
          disabled={isSubmitting}
        />
        {errors.orderNotes?.message && (
          <p className="mt-2 text-sm text-red-600">{errors.orderNotes.message}</p>
        )}
      </Card>
    </div>
  );
}



