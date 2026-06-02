import { hasSellableStock } from '@/lib/product-stock';

type VariantStockInput = {
  stock?: number | null;
  published?: boolean | null;
} | null | undefined;

/** True when a published storefront variant has quantity available to sell. */
export function isPublishedVariantInStock(variant: VariantStockInput): boolean {
  if (!variant || variant.published === false) {
    return false;
  }
  return hasSellableStock(variant.stock);
}
