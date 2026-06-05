export const CHECKOUT_PAYMENT_ASSETS = {
  cash: '/assets/payments/cash.svg',
  idram: '/assets/payments/idram.png',
  visa: '/assets/payments/visa.png',
  mastercard: '/assets/payments/mastercard.png',
  arcaMark: '/assets/payments/arca.png',
} as const;

export const CHECKOUT_CARD_BRAND_ICONS = [
  CHECKOUT_PAYMENT_ASSETS.arcaMark,
  CHECKOUT_PAYMENT_ASSETS.mastercard,
  CHECKOUT_PAYMENT_ASSETS.visa,
] as const;
