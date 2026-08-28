/**
 * Admin/list display for order customer name.
 * Hides the legacy import placeholder "Guest" when a phone is available.
 */
export function displayOrderContactName(
  contactName: string,
  contactPhone: string | null | undefined,
): string {
  const name = contactName.trim();
  if (name.length > 0 && name.toLowerCase() !== "guest") {
    return name;
  }
  const phone = contactPhone?.trim() ?? "";
  if (phone.length > 0 && phone.toLowerCase() !== "unknown") {
    return phone;
  }
  return name || "Customer";
}
