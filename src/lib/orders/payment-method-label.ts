const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash_on_delivery: 'cash',
};

/**
 * Maps internal payment method codes to admin-facing labels.
 */
export function formatPaymentMethodLabel(method: string): string {
  const normalized = method.trim().toLowerCase();
  return PAYMENT_METHOD_LABELS[normalized] ?? method;
}
