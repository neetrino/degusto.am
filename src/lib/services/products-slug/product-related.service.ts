import type { Prisma } from "@prisma/client";
import { db } from "@white-shop/db";
import { logger } from "../../utils/logger";
import { findCategoryBySlug, getAllChildCategoryIds } from "../products-find-query/category-utils";
import { getBaseWhere } from "./product-query-builder";
import {
  transformRelatedProductRows,
  type RelatedCardPayload,
  type RelatedProductRow,
} from "./product-related-transform";

const RELATED_CANDIDATE_LIMIT = 14;

const relatedProductSelect = {
  id: true,
  discountPercent: true,
  primaryCategoryId: true,
  brandId: true,
  media: true,
  translations: {
    select: { slug: true, title: true, locale: true },
    take: 10,
  },
  brand: {
    select: {
      id: true,
      translations: {
        select: { name: true, locale: true },
        take: 10,
      },
    },
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

async function categoryScopeWhere(
  categorySlug: string,
  lang: string
): Promise<Prisma.ProductWhereInput | null> {
  const categoryDoc = await findCategoryBySlug(categorySlug, lang);
  if (!categoryDoc) {
    return null;
  }
  const childCategoryIds = await getAllChildCategoryIds(categoryDoc.id);
  const allCategoryIds = [categoryDoc.id, ...childCategoryIds];
  const categoryConditions = allCategoryIds.flatMap((catId: string) => [
    { primaryCategoryId: catId },
    { categoryIds: { has: catId } },
  ]);
  return { OR: categoryConditions };
}

async function fetchRelatedRows(
  excludeProductId: string,
  lang: string,
  categorySlug: string | undefined
): Promise<RelatedCardPayload[]> {
  const baseWhere: Prisma.ProductWhereInput = {
    published: true,
    deletedAt: null,
    id: { not: excludeProductId },
    variants: { some: { published: true } },
  };

  let where: Prisma.ProductWhereInput = baseWhere;

  if (categorySlug) {
    const catWhere = await categoryScopeWhere(categorySlug, lang);
    if (!catWhere) {
      return [];
    }
    where = { ...baseWhere, AND: catWhere };
  }

  const rows = await db.product.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    take: RELATED_CANDIDATE_LIMIT,
    select: relatedProductSelect,
  });

  return transformRelatedProductRows(rows as RelatedProductRow[], lang);
}

/**
 * Related products for PDP: one light Prisma query + card transform (no full catalog pipeline).
 */
export async function findRelatedByProductSlug(slug: string, lang: string) {
  try {
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
      return { data: [] as RelatedCardPayload[], meta: { total: 0 } };
    }

    const primary =
      product.primaryCategoryId != null
        ? product.categories.find((c) => c.id === product.primaryCategoryId)
        : undefined;
    const primarySlug =
      primary?.translations[0]?.slug ?? product.categories[0]?.translations[0]?.slug;

    const data = await fetchRelatedRows(product.id, lang, primarySlug);
    const filtered = data
      .filter((p) => p.id !== product.id && p.slug.length > 0)
      .slice(0, 10);
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
