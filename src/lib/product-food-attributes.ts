import type { Prisma } from '@prisma/client';

export type ProductFoodTasteFlags = {
  supportsSpicy: boolean;
  supportsGreens: boolean;
};

/** Subset of product columns used in shop/combo taste filters. */
export type ProductTasteCapabilityWhere = {
  supportsSpicy?: boolean;
  supportsGreens?: boolean;
};

/** Read spicy/greens badge flags from product columns. */
export function resolveFoodTasteFlagsFromProduct(
  product: {
    supportsSpicy?: boolean | null;
    supportsGreens?: boolean | null;
  } | null | undefined,
): ProductFoodTasteFlags {
  return {
    supportsSpicy: product?.supportsSpicy === true,
    supportsGreens: product?.supportsGreens === true,
  };
}

/** Prisma filter for shop/combo taste icon filters. */
export function buildProductWhereTasteCapability(
  taste: 'leaf' | 'pepper' | null,
): ProductTasteCapabilityWhere {
  if (taste === 'pepper') {
    return { supportsSpicy: true };
  }
  if (taste === 'leaf') {
    return { supportsGreens: true };
  }
  return {};
}
