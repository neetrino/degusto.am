/**
 * AMD banknote images served from `/public/checkout/cash-notes/`.
 * Filenames match denomination amounts (AMD).
 */
export const CASH_CHANGE_AMD_DENOMINATIONS = [1000, 5000, 10000, 20000] as const;

export type CashChangeAmdDenomination = (typeof CASH_CHANGE_AMD_DENOMINATIONS)[number];

export function cashChangeAmdNoteSrc(amount: CashChangeAmdDenomination): string {
  return `/checkout/cash-notes/amd-${amount}.png`;
}
