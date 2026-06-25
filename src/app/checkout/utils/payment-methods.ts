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

const ARCA_CHECKOUT_ENABLED = process.env.NEXT_PUBLIC_ARCA_CHECKOUT_ENABLED === 'true';

export function usePaymentMethods(): PaymentMethod[] {
  const { t } = useTranslation();

  const methods: PaymentMethod[] = [
    {
      id: 'cash_on_delivery',
      name: t('checkout.payment.cashOnDelivery'),
      shortName: t('checkout.payment.cashOnDeliveryShort'),
      description: t('checkout.payment.cashOnDeliveryDescription'),
      iconKind: 'cash',
    },
  ];

  if (ARCA_CHECKOUT_ENABLED) {
    methods.push({
      id: 'arca',
      name: t('checkout.payment.arca'),
      shortName: t('checkout.payment.arcaShort'),
      description: t('checkout.payment.arcaDescription'),
      iconKind: 'cardBrands',
    });
  }

  methods.push({
    id: 'idram',
    name: t('checkout.payment.idram'),
    shortName: t('checkout.payment.idramShort'),
    description: t('checkout.payment.idramDescription'),
    iconKind: 'idram',
  });

  return methods;
}




