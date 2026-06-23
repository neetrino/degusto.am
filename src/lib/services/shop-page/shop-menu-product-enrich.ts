import { db } from '@white-shop/db';
import type { ShopMenuProductRow } from './shop-page-data.helpers';

type MenuVariantRow = ShopMenuProductRow['variants'][number];

type RawMenuProductRow = Omit<ShopMenuProductRow, 'reviews' | 'averageRating'> & {
  reviews?: ShopMenuProductRow['reviews'];
  averageRating?: number | null;
};

async function fetchAverageRatingsByProductId(
  productIds: readonly string[]
): Promise<Map<string, number>> {
  if (productIds.length === 0) {
    return new Map();
  }

  const aggregates = await db.productReview.groupBy({
    by: ['productId'],
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
    if (typeof avg === 'number' && Number.isFinite(avg)) {
      ratings.set(row.productId, avg);
    }
  }
  return ratings;
}

async function fetchVariantAttributesByProductIds(
  productIds: readonly string[]
): Promise<Map<string, MenuVariantRow[]>> {
  if (productIds.length === 0) {
    return new Map();
  }

  const variantRows = await db.productVariant.findMany({
    where: {
      productId: { in: [...productIds] },
      published: true,
    },
    orderBy: {
      price: 'asc',
    },
    select: {
      id: true,
      productId: true,
      published: true,
      price: true,
      compareAtPrice: true,
      stock: true,
      attributes: true,
    },
  });

  const byProductId = new Map<string, MenuVariantRow[]>();
  for (const variant of variantRows) {
    const existing = byProductId.get(variant.productId) ?? [];
    existing.push({
      id: variant.id,
      published: variant.published,
      price: variant.price,
      compareAtPrice: variant.compareAtPrice,
      stock: variant.stock,
      attributes: variant.attributes,
    });
    byProductId.set(variant.productId, existing);
  }
  return byProductId;
}

/**
 * Adds average review ratings and variant.attributes for multi-variant products only.
 */
export async function enrichShopMenuProductRows(
  rows: RawMenuProductRow[]
): Promise<ShopMenuProductRow[]> {
  if (rows.length === 0) {
    return [];
  }

  const productIds = rows.map((row) => row.id);
  const multiVariantProductIds = rows
    .filter((row) => (row._count?.variants ?? row.variants.length) > 1)
    .map((row) => row.id);

  const [averageRatings, variantAttributesByProductId] = await Promise.all([
    fetchAverageRatingsByProductId(productIds),
    fetchVariantAttributesByProductIds(multiVariantProductIds),
  ]);

  return rows.map((row) => {
    const attributesForProduct = variantAttributesByProductId.get(row.id);
    const variants =
      attributesForProduct ??
      row.variants.map((variant) => ({
        ...variant,
        attributes: undefined,
      }));

    return {
      ...row,
      variants,
      averageRating: averageRatings.get(row.id) ?? null,
      reviews: [],
    };
  });
}
