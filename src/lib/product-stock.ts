/** Sentinel value stored in DB when admin leaves quantity empty (unlimited inventory). */
export const UNLIMITED_STOCK = -1;

/** Max quantity per line when inventory is unlimited (cart/checkout cap). */
export const UNLIMITED_STOCK_MAX_ORDER_QTY = 999;

export function isUnlimitedStock(stock: number | null | undefined): boolean {
  return stock === UNLIMITED_STOCK;
}

/** True when a variant has quantity available to sell (including unlimited). */
export function hasSellableStock(stock: number | null | undefined): boolean {
  if (stock == null) {
    return false;
  }
  return isUnlimitedStock(stock) || stock > 0;
}

export function isStockSufficient(stock: number, requestedQty: number): boolean {
  if (isUnlimitedStock(stock)) {
    return true;
  }
  return stock >= requestedQty;
}

export function getEffectiveMaxQuantity(stock: number): number {
  return isUnlimitedStock(stock) ? UNLIMITED_STOCK_MAX_ORDER_QTY : Math.max(0, stock);
}

/**
 * Parse admin quantity input: empty → unlimited, explicit 0 → out of stock.
 */
export function parseAdminStockInput(input: string | number | null | undefined): number {
  if (input === null || input === undefined) {
    return UNLIMITED_STOCK;
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed === '') {
      return UNLIMITED_STOCK;
    }
    const parsed = parseInt(trimmed, 10);
    if (Number.isNaN(parsed) || parsed < 0) {
      return UNLIMITED_STOCK;
    }
    return parsed;
  }

  if (typeof input === 'number') {
    if (Number.isNaN(input) || input < 0) {
      return UNLIMITED_STOCK;
    }
    return input;
  }

  return UNLIMITED_STOCK;
}

/** Sum variant stocks; any unlimited variant makes the total unlimited. */
export function aggregateStockValues(stocks: number[]): number {
  if (stocks.some(isUnlimitedStock)) {
    return UNLIMITED_STOCK;
  }
  return stocks.reduce((sum, value) => sum + (value || 0), 0);
}
