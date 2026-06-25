import { z } from 'zod';
import { useTranslation } from '../../../lib/i18n-client';
import type { CheckoutFormData } from '../types';

export function useCheckoutSchema() {
  const { t } = useTranslation();

  return z.object({
    firstName: z.string().min(1, t('checkout.errors.firstNameRequired')),
    lastName: z.string().min(1, t('checkout.errors.lastNameRequired')),
    email: z.string().email(t('checkout.errors.invalidEmail')).min(1, t('checkout.errors.emailRequired')),
    phone: z.string().min(1, t('checkout.errors.phoneRequired')).regex(/^\+?[0-9]{8,15}$/, t('checkout.errors.invalidPhone')),
    shippingMethod: z.enum(['pickup', 'delivery'], {
      message: t('checkout.errors.selectShippingMethod'),
    }),
    paymentMethod: z.enum(['idram', 'arca', 'cash_on_delivery'], {
      message: t('checkout.errors.selectPaymentMethod'),
    }),
    shippingAddress: z.string().optional(),
    shippingCity: z.string().optional(),
    cashChangeFrom: z.string().optional(),
    orderNotes: z.string().max(500, t('checkout.errors.notesTooLong')).optional(),
    cardNumber: z.string().optional(),
    cardExpiry: z.string().optional(),
    cardCvv: z.string().optional(),
    cardHolderName: z.string().optional(),
  }).refine((data) => {
    if (data.shippingMethod === 'delivery') {
      return data.shippingAddress && data.shippingAddress.trim().length > 0;
    }
    return true;
  }, {
    message: t('checkout.errors.addressRequired'),
    path: ['shippingAddress'],
  }).refine((data) => {
    if (data.shippingMethod === 'delivery') {
      return data.shippingCity && data.shippingCity.trim().length > 0;
    }
    return true;
  }, {
    message: t('checkout.errors.cityRequired'),
    path: ['shippingCity'],
  }).refine((data) => {
    if (data.paymentMethod !== 'cash_on_delivery') {
      return true;
    }
    if (!data.cashChangeFrom || !data.cashChangeFrom.trim()) {
      return true;
    }
    const normalized = Number(data.cashChangeFrom.replace(',', '.'));
    return Number.isFinite(normalized) && normalized > 0;
  }, {
    message: t('checkout.errors.invalidCashChangeAmount'),
    path: ['cashChangeFrom'],
  });
}




