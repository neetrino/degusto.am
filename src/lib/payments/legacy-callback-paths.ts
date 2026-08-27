/**
 * Live Idram RESULT/SUCCESS/FAIL are already registered in the merchant panel
 * as these exact paths on degusto.am. Keep them. Do not move Idram to
 * /api/v1/payments/idram/* — that would force a bank-panel change.
 *
 * Ineco and FastShift send return/callback URLs per request, but we keep the
 * old paths so cutover does not depend on the bank updating anything.
 */
export const LEGACY_PAYMENT_PATHS = [
  "/idram",
  "/idram/success",
  "/idram/error",
  "/inecobank/result",
  "/pay-by-fastshift/callback",
  "/pay-by-fastshift/webhook",
] as const;

export type LegacyPaymentPath = (typeof LEGACY_PAYMENT_PATHS)[number];

/** True for bank callback prefixes that must stay unprefixed by locale. */
export function isLegacyPaymentPath(pathname: string): boolean {
  const path = pathname.split("?")[0] ?? "";
  return (
    path === "/idram" ||
    path.startsWith("/idram/") ||
    path === "/inecobank" ||
    path.startsWith("/inecobank/") ||
    path === "/pay-by-fastshift" ||
    path.startsWith("/pay-by-fastshift/")
  );
}
