import { db } from '@white-shop/db';
import type { ShopMenuProductRow } from './shop-page-data.helpers';

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

/** Adds average review ratings for menu cards. */
export async function enrichShopMenuProductRows(
  rows: RawMenuProductRow[]
): Promise<ShopMenuProductRow[]> {
  if (rows.length === 0) {
    return [];
  }

  const productIds = rows.map((row) => row.id);
  const averageRatings = await fetchAverageRatingsByProductId(productIds);

  return rows.map((row) => ({
    ...row,
    averageRating: averageRatings.get(row.id) ?? null,
    reviews: [],
  }));
}
