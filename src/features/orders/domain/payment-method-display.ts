/**
 * Admin/list display label for a payments.method value (COD, IDRAM, ARCA).
 */
export function displayPaymentMethodLabel(method: string | null | undefined): string {
  if (!method || method.trim().length === 0) {
    return "—";
  }

  const normalized = method.trim().toUpperCase();
  if (normalized === "COD" || normalized === "CASH") {
    return "Cash";
  }
  if (normalized === "IDRAM") {
    return "Idram";
  }
  if (normalized === "ARCA") {
    return "ArCa";
  }
  return method.trim();
}
