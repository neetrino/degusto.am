/** Flat bag fee charged per distinct product category in the cart (AMD minor units). */
export const BAG_FEE_PER_CATEGORY_AMOUNT = 50;

/**
 * Bag fee = unique category count × {@link BAG_FEE_PER_CATEGORY_AMOUNT}.
 * Empty carts and zero categories yield 0.
 */
export function calculateBagFeeAmount(uniqueCategoryCount: number): number {
  if (!Number.isFinite(uniqueCategoryCount) || uniqueCategoryCount <= 0) {
    return 0;
  }
  return Math.trunc(uniqueCategoryCount) * BAG_FEE_PER_CATEGORY_AMOUNT;
}
