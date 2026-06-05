import { useTranslation } from '../../../lib/i18n-client';

export type PaymentMethodId = 'idram' | 'arca' | 'cash_on_delivery';

export type PaymentMethodIconKind = 'cash' | 'idram' | 'cardBrands';

export interface PaymentMethod {
  id: PaymentMethodId;
  name: string;
  shortName: string;
  description: string;
  iconKind: PaymentMethodIconKind;
}

export function usePaymentMethods(): PaymentMethod[] {
  const { t } = useTranslation();

  return [
    {
      id: 'cash_on_delivery',
      name: t('checkout.payment.cashOnDelivery'),
      shortName: t('checkout.payment.cashOnDeliveryShort'),
      description: t('checkout.payment.cashOnDeliveryDescription'),
      iconKind: 'cash',
    },
    {
      id: 'arca',
      name: t('checkout.payment.arca'),
      shortName: t('checkout.payment.arcaShort'),
      description: t('checkout.payment.arcaDescription'),
      iconKind: 'cardBrands',
    },
    {
      id: 'idram',
      name: t('checkout.payment.idram'),
      shortName: t('checkout.payment.idramShort'),
      description: t('checkout.payment.idramDescription'),
      iconKind: 'idram',
    },
  ];
}




