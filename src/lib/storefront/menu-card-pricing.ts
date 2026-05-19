/**
 * Compare-at price for menu cards: only when above the selling price (never 0 / placeholder).
 */
export function resolveMenuCardCompareAtPrice(
  price: number,
  compareAtPrice: number | null | undefined
): number {
  if (
    typeof compareAtPrice === 'number' &&
    Number.isFinite(compareAtPrice) &&
    compareAtPrice > price
  ) {
    return compareAtPrice;
  }
  return price;
}

/** True when a strikethrough old price should be shown on shop/combo cards. */
export function shouldShowMenuCardStrikethroughPrice(price: number, oldPrice: number): boolean {
  return oldPrice > price;
}
