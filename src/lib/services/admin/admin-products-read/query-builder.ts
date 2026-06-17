import { Prisma } from "@prisma/client";
import type { ProductFilters } from "./types";

/**
 * Build where clause for product queries
 */
export function buildProductWhereClause(filters: ProductFilters): Prisma.ProductWhereInput {
  const andConditions: Prisma.ProductWhereInput[] = [{ deletedAt: null }];

  // Search filter
  if (filters.search) {
    andConditions.push({
      OR: [
        {
          translations: {
            some: {
              title: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
          },
        },
        {
          variants: {
            some: {
              sku: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
          },
        },
      ],
    });
  }

  // Category filter - support both single category and multiple categories
  const categoryIds =
    filters.categories && filters.categories.length > 0
      ? filters.categories
      : filters.category
        ? [filters.category]
        : [];

  if (categoryIds.length > 0) {
    andConditions.push({
      OR: [
        {
          primaryCategoryId: { in: categoryIds },
        },
        {
          categories: {
            some: {
              id: { in: categoryIds },
            },
          },
        },
        {
          categoryIds: {
            hasSome: categoryIds,
          },
        },
      ],
    });
  }

  // SKU filter
  if (filters.sku) {
    andConditions.push({
      variants: {
        some: {
          sku: {
            contains: filters.sku,
            mode: "insensitive",
          },
        },
      },
    });
  }

  if (andConditions.length === 1) {
    return andConditions[0];
  }

  return {
    AND: andConditions,
  };
}

/**
 * Build orderBy clause for product queries
 */
export function buildProductOrderByClause(filters: ProductFilters): Prisma.ProductOrderByWithRelationInput {
  if (filters.sort) {
    const [field, direction] = filters.sort.split("-");
    return { [field]: direction || "desc" };
  }
  return { createdAt: "desc" };
}




