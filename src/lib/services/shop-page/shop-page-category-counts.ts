import {
  FOOD_ATTR_GREENS_KEY,
  FOOD_ATTR_SPICY_KEY,
} from '@/lib/product-food-attributes';
import type { StorefrontLocale } from '@/lib/i18n/locale';
import { resolveVariantUsdBoundsFromAmd } from '@/lib/storefront/variant-price-filter';
import { db } from '@white-shop/db';
import { Prisma } from '@prisma/client';
import type { ShopMenuQuery } from './shop-page-query.types';

export type ShopCategoryProductCounts = {
  allProductCount: number;
  countBySlug: Record<string, number>;
};

function toCountNumber(value: unknown): number {
  if (typeof value === 'bigint') {
    return Number(value);
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
  }
  return 0;
}

function variantHasAttributeValueExists(attrKey: string, attrValue: string): Prisma.Sql {
  return Prisma.sql`
    EXISTS (
      SELECT 1
      FROM product_variants pv
      INNER JOIN product_variant_options pvo ON pvo."variantId" = pv.id
      INNER JOIN attribute_values av ON av.id = pvo."valueId"
      INNER JOIN attributes a ON a.id = av."attributeId" AND a.key = ${attrKey}
      WHERE pv."productId" = p.id
        AND pv.published = true
        AND av.value = ${attrValue}
    )
  `;
}

/** SQL AND-clause matching `buildShopProductWhereBase` (products alias `p`). */
function buildShopProductBaseFilterSql(
  locale: StorefrontLocale,
  query: ShopMenuQuery
): Prisma.Sql {
  const { minUsd: minPriceUsd, maxUsd: maxPriceUsd } = resolveVariantUsdBoundsFromAmd(
    query.minPriceAmd,
    query.maxPriceAmd
  );

  const clauses: Prisma.Sql[] = [
    Prisma.sql`p.published = true`,
    Prisma.sql`p."deletedAt" IS NULL`,
    Prisma.sql`
      NOT EXISTS (
        SELECT 1
        FROM "_ProductCategories" pc_combo
        INNER JOIN categories c_combo ON c_combo.id = pc_combo."A"
        INNER JOIN category_translations ct_combo
          ON ct_combo."categoryId" = c_combo.id
          AND ct_combo.locale = 'en'
          AND ct_combo.slug = 'combo'
        WHERE pc_combo."B" = p.id
      )
    `,
  ];

  if (query.selectedSearchQuery) {
    const searchPattern = `%${query.selectedSearchQuery}%`;
    clauses.push(Prisma.sql`
      EXISTS (
        SELECT 1
        FROM product_translations pt
        WHERE pt."productId" = p.id
          AND pt.locale IN (${locale}, 'en')
          AND (
            pt.title ILIKE ${searchPattern}
            OR pt.subtitle ILIKE ${searchPattern}
          )
      )
    `);
  }

  const minUsd =
    minPriceUsd !== null && Number.isFinite(minPriceUsd) ? minPriceUsd : null;
  const maxUsd =
    maxPriceUsd !== null && Number.isFinite(maxPriceUsd) ? maxPriceUsd : null;

  if (minUsd !== null || maxUsd !== null) {
    const priceParts: Prisma.Sql[] = [Prisma.sql`pv.published = true`];
    if (minUsd !== null) {
      priceParts.push(Prisma.sql`pv.price >= ${minUsd}`);
    }
    if (maxUsd !== null) {
      priceParts.push(Prisma.sql`pv.price <= ${maxUsd}`);
    }
    clauses.push(Prisma.sql`
      EXISTS (
        SELECT 1
        FROM product_variants pv
        WHERE pv."productId" = p.id
          AND ${Prisma.join(priceParts, ' AND ')}
      )
    `);
  }

  if (query.tasteFilter === 'pepper') {
    clauses.push(variantHasAttributeValueExists(FOOD_ATTR_SPICY_KEY, 'spicy'));
    clauses.push(variantHasAttributeValueExists(FOOD_ATTR_SPICY_KEY, 'not-spicy'));
  } else if (query.tasteFilter === 'leaf') {
    clauses.push(variantHasAttributeValueExists(FOOD_ATTR_GREENS_KEY, 'with-greens'));
    clauses.push(variantHasAttributeValueExists(FOOD_ATTR_GREENS_KEY, 'without-greens'));
  }

  return Prisma.join(clauses, ' AND ');
}

/**
 * Total matching products and per-category slug counts in two queries (replaces N+1 `product.count`).
 */
export async function fetchShopMenuCategoryProductCounts(
  locale: StorefrontLocale,
  query: ShopMenuQuery,
  slugsToCount: string[]
): Promise<ShopCategoryProductCounts> {
  const baseFilter = buildShopProductBaseFilterSql(locale, query);

  const allCountPromise = db.$queryRaw<Array<{ total: unknown }>>(Prisma.sql`
    SELECT COUNT(*)::bigint AS total
    FROM products p
    WHERE ${baseFilter}
  `);

  const slugCountsPromise =
    slugsToCount.length === 0
      ? Promise.resolve([] as Array<{ slug: string; total: unknown }>)
      : db.$queryRaw<Array<{ slug: string; total: unknown }>>(Prisma.sql`
          SELECT ct.slug AS slug, COUNT(DISTINCT p.id)::bigint AS total
          FROM products p
          INNER JOIN "_ProductCategories" pc ON pc."B" = p.id
          INNER JOIN categories c
            ON c.id = pc."A"
            AND c.published = true
            AND c."deletedAt" IS NULL
          INNER JOIN category_translations ct
            ON ct."categoryId" = c.id
            AND ct.locale IN (${locale}, 'en')
            AND ct.slug IN (${Prisma.join(slugsToCount)})
          WHERE ${baseFilter}
          GROUP BY ct.slug
        `);

  const [allCountRows, slugCountRows] = await Promise.all([allCountPromise, slugCountsPromise]);

  const countBySlug: Record<string, number> = {};
  for (const slug of slugsToCount) {
    countBySlug[slug] = 0;
  }
  for (const row of slugCountRows) {
    if (typeof row.slug === 'string' && row.slug) {
      countBySlug[row.slug] = toCountNumber(row.total);
    }
  }

  return {
    allProductCount: toCountNumber(allCountRows[0]?.total),
    countBySlug,
  };
}
