import { isUnlimitedStock, UNLIMITED_STOCK } from '@/lib/product-stock';
import type { ProductVariant } from '../types';
import { isVariantCompatible } from './variant-compatibility';

function sumVariantStocks(variants: ProductVariant[]): number {
  if (variants.some((variant) => isUnlimitedStock(variant.stock))) {
    return UNLIMITED_STOCK;
  }
  return variants.reduce((sum, variant) => sum + variant.stock, 0);
}

/**
 * Calculate stock for attribute value based on current selections
 * If other attributes are selected, show stock only for compatible variants
 * Otherwise, show total stock for all variants with this value
 */
export function calculateStock(
  variants: ProductVariant[],
  currentSelections: Map<string, string>,
  attrKey: string
): number {
  if (currentSelections.size > 0) {
    const compatibleVariants = variants.filter((v) =>
      isVariantCompatible(v, currentSelections, attrKey)
    );
    return sumVariantStocks(compatibleVariants);
  }
  return sumVariantStocks(variants);
}




