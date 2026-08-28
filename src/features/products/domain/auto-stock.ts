/** Initial / replenished on-hand quantity for new catalog products. */
export const PRODUCT_DEFAULT_STOCK = 10_000;

/**
 * When stock after a sale is at or below this value, it is reset to
 * {@link PRODUCT_DEFAULT_STOCK}.
 */
export const PRODUCT_STOCK_REPLENISH_THRESHOLD = 1_000;

export type StockAfterSalePlan = {
  /** Balance immediately after deducting the sold quantity. */
  orderBalance: number;
  /** Balance persisted on the product (may equal orderBalance or default stock). */
  finalBalance: number;
  /** Positive delta to record when auto-replenishing; otherwise null. */
  replenishDelta: number | null;
};

/**
 * Plans stock after an order decrement, including auto-replenish to default.
 */
export function planStockAfterSale(
  onHand: number,
  quantity: number,
): StockAfterSalePlan {
  const orderBalance = onHand - quantity;
  if (orderBalance <= PRODUCT_STOCK_REPLENISH_THRESHOLD) {
    return {
      orderBalance,
      finalBalance: PRODUCT_DEFAULT_STOCK,
      replenishDelta: PRODUCT_DEFAULT_STOCK - orderBalance,
    };
  }
  return {
    orderBalance,
    finalBalance: orderBalance,
    replenishDelta: null,
  };
}
