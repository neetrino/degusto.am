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

type CartLineForStock = {
  id: string;
  variant: { id: string };
  quantity: number;
};

/**
 * Max quantity one cart line may reach given variant stock and other lines for the same variant.
 */
export function maxCartLineQuantity(
  variantStock: number | undefined,
  variantId: string,
  lineItemId: string,
  cartItems: ReadonlyArray<CartLineForStock>
): number {
  if (variantStock === undefined) {
    return UNLIMITED_STOCK_MAX_ORDER_QTY;
  }
  if (isUnlimitedStock(variantStock)) {
    return UNLIMITED_STOCK_MAX_ORDER_QTY;
  }

  const otherLinesQty = cartItems
    .filter((item) => item.variant.id === variantId && item.id !== lineItemId)
    .reduce((sum, item) => sum + item.quantity, 0);

  return Math.max(0, variantStock - otherLinesQty);
}

type CartVariantLine = {
  id: string;
  variantId: string;
  quantity: number;
};

/** Total units of a variant in cart after an add or line update. */
export function totalVariantQuantityInCart(
  items: ReadonlyArray<CartVariantLine>,
  variantId: string,
  change: { lineId: string; quantity: number } | { addQuantity: number }
): number {
  let total = 0;
  if ('lineId' in change) {
    for (const item of items) {
      if (item.variantId !== variantId) {
        continue;
      }
      total += item.id === change.lineId ? change.quantity : item.quantity;
    }
    return total;
  }

  for (const item of items) {
    if (item.variantId === variantId) {
      total += item.quantity;
    }
  }
  return total + change.addQuantity;
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
