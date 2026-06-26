import { db } from '@white-shop/db';

/**
 * Batch average rating per product (published reviews only).
 * One indexed groupBy instead of loading every review row.
 */
export async function fetchAverageRatingsByProductId(
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
