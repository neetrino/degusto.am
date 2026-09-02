/**
 * Admin/list label for payments.method — store values as-is for new records
 * (idram, arca, cache); normalize legacy COD / IDRAM / ARCA / CASH.
 */
export function displayPaymentMethodLabel(method: string | null | undefined): string {
  if (!method || method.trim().length === 0) {
    return "—";
  }

  const normalized = method.trim().toLowerCase();
  if (
    normalized === "cod" ||
    normalized === "cash" ||
    normalized === "cache"
  ) {
    return "cache";
  }
  if (normalized === "idram") {
    return "idram";
  }
  if (normalized === "arca") {
    return "arca";
  }
  return method.trim();
}
