import { convertPrice } from '@/lib/currency';

/**
 * Cart and checkout unit prices are stored in USD (`ProductVariant.price`).
 * Attribute `priceAdjustment` values on the storefront are entered in AMD.
 */
export function computeLineUnitPriceUsd(
  variantPriceUsd: number,
  adjustmentAmd: number
): number {
  const base = Number.isFinite(variantPriceUsd) ? variantPriceUsd : 0;
  if (!Number.isFinite(adjustmentAmd) || adjustmentAmd <= 0) {
    return base;
  }
  return base + convertPrice(adjustmentAmd, 'AMD', 'USD');
}
