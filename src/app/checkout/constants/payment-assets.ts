export const CHECKOUT_PAYMENT_ASSETS = {
  cash: '/assets/payments/cash.svg',
  idram: '/assets/payments/idram.svg',
  visa: '/assets/payments/visa.svg',
  mastercard: '/assets/payments/mastercard.svg',
  arcaMark: '/assets/payments/arca-mark.svg',
} as const;

export const CHECKOUT_CARD_BRAND_ICONS = [
  CHECKOUT_PAYMENT_ASSETS.arcaMark,
  CHECKOUT_PAYMENT_ASSETS.mastercard,
  CHECKOUT_PAYMENT_ASSETS.visa,
] as const;
