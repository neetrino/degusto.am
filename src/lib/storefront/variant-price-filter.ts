import type { Prisma } from '@prisma/client';
import { storefrontAmdPriceBoundToVariantUsd } from '@/lib/currency';

export type VariantUsdPriceBounds = {
  minUsd: number | null;
  maxUsd: number | null;
};

/** AMD filter inputs from the storefront URL → finite USD bounds for `ProductVariant.price`. */
export function resolveVariantUsdBoundsFromAmd(
  minPriceAmd: number | null,
  maxPriceAmd: number | null
): VariantUsdPriceBounds {
  return {
    minUsd: minPriceAmd !== null ? storefrontAmdPriceBoundToVariantUsd(minPriceAmd) : null,
    maxUsd: maxPriceAmd !== null ? storefrontAmdPriceBoundToVariantUsd(maxPriceAmd) : null,
  };
}

/** `variants.some` fragment for published variants within optional USD price bounds. */
export function buildPublishedVariantPriceSomeWhere(
  bounds: VariantUsdPriceBounds
): Prisma.ProductVariantWhereInput | null {
  const gte =
    bounds.minUsd !== null && Number.isFinite(bounds.minUsd) ? bounds.minUsd : null;
  const lte =
    bounds.maxUsd !== null && Number.isFinite(bounds.maxUsd) ? bounds.maxUsd : null;

  if (gte === null && lte === null) {
    return null;
  }

  return {
    published: true,
    price: {
      ...(gte !== null ? { gte } : {}),
      ...(lte !== null ? { lte } : {}),
    },
  };
}
