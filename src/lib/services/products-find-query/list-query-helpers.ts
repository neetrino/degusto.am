import type { Prisma } from "@prisma/client";
import type { ProductFilters } from "./types";

/** Normalize comma-separated filter values; drop placeholders like "undefined". */
export function normalizeFilterList(
  value?: string,
  transform?: (v: string) => string
): string[] {
  if (!value || typeof value !== "string") {
    return [];
  }

  const invalidTokens = new Set(["undefined", "null", ""]);
  const items = value
    .split(",")
    .map((v) => v.trim())
    .filter((v) => !invalidTokens.has(v.toLowerCase()));

  if (transform) {
    return items.map(transform);
  }

  return items;
}

/** Sorts that still require in-memory ordering (variant min price, bestseller rank). */
export function needsInMemoryProductSort(filters: ProductFilters): boolean {
  const { filter, sort = "createdAt" } = filters;
  if (filter === "bestseller" || sort === "popular") {
    return true;
  }
  if (sort === "price-asc" || sort === "price-desc" || sort === "price") {
    return true;
  }
  return false;
}

/**
 * Matches legacy min-variant price filter:
 * min(published variant prices) within [minPrice, maxPrice].
 */
export function buildPriceRangeWhere(
  minPrice?: number,
  maxPrice?: number
): Prisma.ProductWhereInput | null {
  const hasMin = minPrice != null && Number.isFinite(minPrice);
  const hasMax = maxPrice != null && Number.isFinite(maxPrice);
  if (!hasMin && !hasMax) {
    return null;
  }

  const parts: Prisma.ProductWhereInput[] = [
    { variants: { some: { published: true } } },
  ];

  if (hasMin) {
    parts.push({
      NOT: {
        variants: {
          some: {
            published: true,
            price: { lt: minPrice },
          },
        },
      },
    });
  }

  if (hasMax) {
    parts.push({
      variants: {
        some: {
          published: true,
          price: { lte: maxPrice },
        },
      },
    });
  }

  return { AND: parts };
}

export function mergePriceRangeIntoWhere(
  where: Prisma.ProductWhereInput,
  minPrice?: number,
  maxPrice?: number
): Prisma.ProductWhereInput {
  const priceWhere = buildPriceRangeWhere(minPrice, maxPrice);
  if (!priceWhere) {
    return where;
  }
  return { AND: [where, priceWhere] };
}

const DEFAULT_LIST_ORDER_BY: Prisma.ProductOrderByWithRelationInput = {
  createdAt: "desc",
};

/** DB order for paginated list path (newest / default). */
export function resolveDbProductListOrderBy(
  _filters: ProductFilters
): Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] {
  return DEFAULT_LIST_ORDER_BY;
}

export function needsLegacyListOverFetch(filters: ProductFilters): boolean {
  return needsInMemoryProductSort(filters);
}
