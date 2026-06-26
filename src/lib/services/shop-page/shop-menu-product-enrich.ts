import { fetchAverageRatingsByProductId } from '@/lib/services/reviews/fetch-average-ratings-by-product-id';
import type { ShopMenuProductRow } from './shop-page-data.helpers';

type RawMenuProductRow = Omit<ShopMenuProductRow, 'reviews' | 'averageRating'> & {
  reviews?: ShopMenuProductRow['reviews'];
  averageRating?: number | null;
};

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
