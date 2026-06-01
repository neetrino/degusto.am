/**
 * Resolved discount % for storefront cards and PDP (badge, price row).
 */
export function resolveStorefrontDiscountPercent(input: {
  price: number;
  originalPrice?: number | null;
  compareAtPrice?: number | null;
  productDiscount?: number | null;
}): number | null {
  const { price, originalPrice, compareAtPrice, productDiscount } = input;

  if (typeof productDiscount === 'number' && productDiscount > 0) {
    return Math.round(productDiscount);
  }

  if (originalPrice != null && originalPrice > price && originalPrice > 0) {
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  }

  if (compareAtPrice != null && compareAtPrice > price && compareAtPrice > 0) {
    return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
  }

  return null;
}
