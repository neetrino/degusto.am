import { Prisma } from "@prisma/client";
import { db } from "@white-shop/db";
import { logger } from "../../utils/logger";
import type { ProductFilters } from "./types";
import { getAllChildCategoryIds, findCategoryBySlug } from "./category-utils";
import { buildProductSearchWhere } from "./search-filter";

/**
 * Build category filter for where clause
 */
async function buildCategoryFilter(
  category: string,
  lang: string,
  existingWhere: Prisma.ProductWhereInput
): Promise<Prisma.ProductWhereInput | null> {
  const categoryDoc = await findCategoryBySlug(category, lang);

  if (!categoryDoc) {
    return null; // Category not found - return null to indicate empty result
  }

  // Get all child categories (subcategories) recursively
  const childCategoryIds = await getAllChildCategoryIds(categoryDoc.id);
  const allCategoryIds = [categoryDoc.id, ...childCategoryIds];
  
  logger.debug('Category IDs to include', {
    parent: categoryDoc.id,
    children: childCategoryIds,
    total: allCategoryIds.length
  });
  
  // Build OR conditions for all categories (parent + children)
  const categoryConditions = allCategoryIds.flatMap((catId: string) => [
    { primaryCategoryId: catId },
    { categoryIds: { has: catId } },
  ]);
  
  if (existingWhere.OR) {
    return {
      AND: [
        { OR: existingWhere.OR },
        {
          OR: categoryConditions,
        },
      ],
    };
  }
  
  return {
    OR: categoryConditions,
  };
}

/**
 * Build filter for new, featured, bestseller
 */
async function loadBestsellerProductIds(): Promise<string[]> {
  const bestsellerProductIds: string[] = [];
  type BestsellerVariant = { variantId: string | null; _sum: { quantity: number | null } };
  const raw = await db.orderItem.groupBy({
    by: ["variantId"],
    _sum: { quantity: true },
    where: {
      variantId: {
        not: null,
      },
    },
    orderBy: {
      _sum: {
        quantity: "desc" as const,
      },
    },
    take: 200,
  });
  const bestsellerVariants: BestsellerVariant[] = raw as BestsellerVariant[];

  const variantIds = bestsellerVariants
    .map((item) => item.variantId)
    .filter((id): id is string => Boolean(id));

  if (variantIds.length === 0) {
    return [];
  }

  const variantProductMap = await db.productVariant.findMany({
    where: { id: { in: variantIds } },
    select: { id: true, productId: true },
  });

  const variantToProduct = new Map<string, string>();
  variantProductMap.forEach(({ id, productId }: { id: string; productId: string }) => {
    variantToProduct.set(id, productId);
  });

  const productSales = new Map<string, number>();
  bestsellerVariants.forEach((item: BestsellerVariant) => {
    const variantId = item.variantId;
    if (!variantId) return;
    const productId = variantToProduct.get(variantId);
    if (!productId) return;
    const qty = item._sum?.quantity || 0;
    productSales.set(productId, (productSales.get(productId) || 0) + qty);
  });

  bestsellerProductIds.push(
    ...Array.from(productSales.entries())
      .sort((a, b) => (b[1] || 0) - (a[1] || 0))
      .map(([productId]) => productId)
  );

  return bestsellerProductIds;
}

async function buildFilterFilter(
  filter: string,
  sort: string | undefined,
  existingWhere: Prisma.ProductWhereInput
): Promise<{
  where: Prisma.ProductWhereInput;
  bestsellerProductIds: string[];
}> {
  let bestsellerProductIds: string[] = [];

  if (filter === "new") {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return {
      where: {
        ...existingWhere,
        createdAt: { gte: thirtyDaysAgo },
      },
      bestsellerProductIds,
    };
  }

  if (filter === "featured") {
    return {
      where: {
        ...existingWhere,
        featured: true,
      },
      bestsellerProductIds,
    };
  }

  if (filter === "bestseller" || sort === "popular") {
    bestsellerProductIds = await loadBestsellerProductIds();
  }

  if (filter === "bestseller" && bestsellerProductIds.length > 0) {
    return {
      where: {
        ...existingWhere,
        id: {
          in: bestsellerProductIds,
        },
      },
      bestsellerProductIds,
    };
  }

  return {
    where: existingWhere,
    bestsellerProductIds,
  };
}

/**
 * Build where clause for product query
 */
export async function buildWhereClause(
  filters: ProductFilters
): Promise<{
  where: Prisma.ProductWhereInput | null;
  bestsellerProductIds: string[];
}> {
  const {
    category,
    search,
    ids,
    filter,
    sort,
    lang = "en",
  } = filters;

  const bestsellerProductIds: string[] = [];

  // Build base where clause
  let where: Prisma.ProductWhereInput = {
    published: true,
    deletedAt: null,
  };

  if (ids && ids.length > 0) {
    where.id = {
      in: ids,
    };
  }

  // Add search filter
  if (search && search.trim()) {
    const searchFilter = buildProductSearchWhere(search);
    where = { ...where, ...searchFilter };
  }

  // Add category filter
  if (category) {
    const categoryWhere = await buildCategoryFilter(category, lang, where);
    if (categoryWhere === null) {
      // Category not found - return empty result
      return {
        where: null,
        bestsellerProductIds: [],
      };
    }
    where = { ...where, ...categoryWhere };
  }

  // Add filter for new, featured, bestseller
  const filterResult = await buildFilterFilter(filter || "", sort, where);
  where = filterResult.where;
  bestsellerProductIds.push(...filterResult.bestsellerProductIds);

  return {
    where,
    bestsellerProductIds,
  };
}

