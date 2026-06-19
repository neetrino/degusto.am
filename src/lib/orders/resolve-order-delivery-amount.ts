/** Delivery line only — excludes bag fee (legacy orders stored both in shippingAmount). */
export function resolveOrderDeliveryAmount(params: {
  shippingAmount: number;
  bagFeeAmount: number;
  deliveryPriceFromEvent?: unknown;
}): number {
  const fromEvent = params.deliveryPriceFromEvent;
  if (typeof fromEvent === "number" && Number.isFinite(fromEvent)) {
    return Math.max(0, fromEvent);
  }
  return Math.max(0, params.shippingAmount - params.bagFeeAmount);
}
