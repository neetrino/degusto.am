type OrderStatusKind = 'order' | 'payment' | 'fulfillment';

const STATUS_NAMESPACE: Record<OrderStatusKind, string> = {
  order: 'orders.status',
  payment: 'orders.paymentStatus',
  fulfillment: 'orders.fulfillmentStatus',
};

/**
 * Returns a localized label for an order, payment, or fulfillment status code.
 * Falls back to the raw status when no translation key exists.
 */
export function formatOrderStatusLabel(
  t: (path: string) => string,
  status: string,
  kind: OrderStatusKind,
): string {
  const normalized = status.trim().toLowerCase();
  if (!normalized) {
    return status;
  }

  const path = `${STATUS_NAMESPACE[kind]}.${normalized}`;
  const label = t(path);
  return label === path ? status : label;
}
