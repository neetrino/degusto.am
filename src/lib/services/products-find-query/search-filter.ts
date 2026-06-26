import { Prisma } from "@prisma/client";

/** Trims storefront product search input; empty after trim means no search predicate. */
export function normalizeProductSearchTerm(search: string): string {
  return search.trim();
}

/**
 * Shared product search predicate used by catalog, filter facets, and instant-search.
 * Matches title, subtitle (any locale), and variant SKU — case-insensitive contains.
 */
export function buildProductSearchWhere(search: string): Prisma.ProductWhereInput {
  const term = normalizeProductSearchTerm(search);
  if (!term) {
    return {};
  }

  return {
    OR: [
      {
        translations: {
          some: {
            title: {
              contains: term,
              mode: "insensitive",
            },
          },
        },
      },
      {
        translations: {
          some: {
            subtitle: {
              contains: term,
              mode: "insensitive",
            },
          },
        },
      },
      {
        variants: {
          some: {
            sku: {
              contains: term,
              mode: "insensitive",
            },
          },
        },
      },
    ],
  };
}

/** Merges shared search OR-clause into an existing product where (AND semantics). */
export function mergeProductSearchIntoWhere(
  where: Prisma.ProductWhereInput,
  search?: string
): Prisma.ProductWhereInput {
  if (!search) {
    return where;
  }
  const searchWhere = buildProductSearchWhere(search);
  if (Object.keys(searchWhere).length === 0) {
    return where;
  }
  return { ...where, ...searchWhere };
}
