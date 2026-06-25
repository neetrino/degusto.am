export const PAYMENT_STATUS = {
  pending: "pending",
  paid: "paid",
  failed: "failed",
  cancelled: "cancelled",
  refunded: "refunded",
} as const;

export const ISO4217_NUMERIC: Record<string, string> = {
  AMD: "051",
  USD: "840",
  EUR: "978",
  RUB: "643",
};

/** Arca expects amounts in minor units (1000 AMD → 100000). */
export function toArcaMinorUnits(amount: number, currency: string): number {
  const factor = currency === "AMD" ? 100 : 100;
  return Math.round(amount * factor);
}
