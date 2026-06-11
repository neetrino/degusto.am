import { Prisma } from "@prisma/client";

function normalizeSearchTerm(search: string): string {
  return search.trim();
}

/**
 * Shared product search predicate used by catalog and instant-search endpoints.
 */
export function buildProductSearchWhere(search: string): Prisma.ProductWhereInput {
  const term = normalizeSearchTerm(search);
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
