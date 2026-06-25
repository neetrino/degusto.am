import type { Prisma } from "@prisma/client";
import { db } from "@white-shop/db";
import { logger } from "../../utils/logger";
import { getAllChildCategoryIds } from "../products-find-query/category-utils";
import { getBaseWhere } from "./product-query-builder";
import {
  transformRelatedProductRows,
  type RelatedCardPayload,
  type RelatedProductRow,
} from "./product-related-transform";

const RELATED_CANDIDATE_LIMIT = 14;
const RELATED_RESPONSE_LIMIT = 10;

const relatedProductSelect = {
  id: true,
  discountPercent: true,
  primaryCategoryId: true,
  media: true,
  translations: {
    select: { slug: true, title: true, locale: true },
    take: 10,
  },
  variants: {
    where: { published: true },
    orderBy: { price: "asc" as const },
    take: 1,
    select: {
      id: true,
      price: true,
      compareAtPrice: true,
      stock: true,
    },
  },
  _count: {
    select: {
      reviews: {
        where: { published: true },
      },
    },
  },
  categories: {
    select: {
      id: true,
      translations: {
        select: { slug: true, title: true, locale: true },
        take: 6,
      },
    },
  },
} satisfies Prisma.ProductSelect;

async function fetchAverageRatingsByProductId(
  productIds: readonly string[]
): Promise<Map<string, number>> {
  if (productIds.length === 0) {
    return new Map();
  }

  const aggregates = await db.productReview.groupBy({
    by: ["productId"],
    where: {
      productId: { in: [...productIds] },
      published: true,
    },
    _avg: {
      rating: true,
    },
  });

  const ratings = new Map<string, number>();
  for (const row of aggregates) {
    const avg = row._avg.rating;
    if (typeof avg === "number" && Number.isFinite(avg)) {
      ratings.set(row.productId, avg);
    }
  }
  return ratings;
}

async function categoryScopeWhereById(
  categoryId: string
): Promise<Prisma.ProductWhereInput> {
  const childCategoryIds = await getAllChildCategoryIds(categoryId);
  const allCategoryIds = [categoryId, ...childCategoryIds];
  const categoryConditions = allCategoryIds.flatMap((catId: string) => [
    { primaryCategoryId: catId },
    { categoryIds: { has: catId } },
  ]);
  return { OR: categoryConditions };
}

async function fetchRelatedRows(
  lang: string,
  primaryCategoryId: string | null | undefined,
  options?: { excludeProductId?: string; limit?: number }
): Promise<RelatedCardPayload[]> {
  const excludeProductId = options?.excludeProductId;
  const take = options?.limit ?? RELATED_CANDIDATE_LIMIT;
  const baseWhere: Prisma.ProductWhereInput = {
    published: true,
    deletedAt: null,
    variants: { some: { published: true } },
    ...(excludeProductId ? { id: { not: excludeProductId } } : {}),
  };

  let where: Prisma.ProductWhereInput = baseWhere;

  if (primaryCategoryId) {
    const catWhere = await categoryScopeWhereById(primaryCategoryId);
    where = { ...baseWhere, AND: catWhere };
  }

  const rows = await db.product.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    take,
    select: relatedProductSelect,
  });

  const averageRatings = await fetchAverageRatingsByProductId(rows.map((row) => row.id));
  return transformRelatedProductRows(rows as RelatedProductRow[], lang, averageRatings);
}

export type ProductRelatedContext = {
  productId: string;
  primaryCategoryId: string | null;
  primaryCategorySlug: string | null;
};

export async function resolveProductRelatedContextBySlug(
  slug: string,
  lang: string
): Promise<ProductRelatedContext | null> {
  let product = await db.product.findFirst({
    where: getBaseWhere(slug, lang),
    select: {
      id: true,
      primaryCategoryId: true,
      categories: {
        select: {
          id: true,
          translations: {
            where: { locale: lang },
            select: { slug: true },
            take: 1,
          },
        },
      },
    },
  });

  if (!product && lang !== "en") {
    product = await db.product.findFirst({
      where: getBaseWhere(slug, "en"),
      select: {
        id: true,
        primaryCategoryId: true,
        categories: {
          select: {
            id: true,
            translations: {
              where: { locale: "en" },
              select: { slug: true },
              take: 1,
            },
          },
        },
      },
    });
  }

  if (!product) {
    return null;
  }

  const primary =
    product.primaryCategoryId != null
      ? product.categories.find((c) => c.id === product.primaryCategoryId)
      : undefined;
  const primaryCategorySlug =
    primary?.translations[0]?.slug ?? product.categories[0]?.translations[0]?.slug ?? null;

  return {
    productId: product.id,
    primaryCategoryId: product.primaryCategoryId,
    primaryCategorySlug,
  };
}

/**
 * Related products in the same category (shared cache source for PDP carousel).
 */
export async function findRelatedByCategoryId(
  primaryCategoryId: string,
  lang: string,
  limit: number = RELATED_RESPONSE_LIMIT
): Promise<RelatedCardPayload[]> {
  const data = await fetchRelatedRows(lang, primaryCategoryId, { limit: limit + 1 });
  return data.filter((item) => item.slug.length > 0).slice(0, limit);
}

/**
 * Related products for PDP: one light Prisma query + card transform (no full catalog pipeline).
 */
export async function findRelatedByProductSlug(slug: string, lang: string) {
  try {
    const context = await resolveProductRelatedContextBySlug(slug, lang);
    if (!context) {
      return { data: [] as RelatedCardPayload[], meta: { total: 0 } };
    }

    const data = await fetchRelatedRows(lang, context.primaryCategoryId, {
      excludeProductId: context.productId,
    });
    const filtered = data
      .filter((p) => p.id !== context.productId && p.slug.length > 0)
      .slice(0, RELATED_RESPONSE_LIMIT);
    return { data: filtered, meta: { total: filtered.length } };
  } catch (error: unknown) {
    logger.warn("findRelatedByProductSlug failed", {
      slug,
      lang,
      error: error instanceof Error ? error.message : String(error),
    });
    return { data: [], meta: { total: 0 } };
  }
}
