import { db } from "@white-shop/db";

export interface ProductReviewSummary {
  count: number;
  averageRating: number;
}

/**
 * Lightweight aggregate for PDP header (no user join, no full list).
 */
export async function getProductReviewSummary(
  productId: string
): Promise<ProductReviewSummary> {
  const aggregate = await db.productReview.aggregate({
    where: {
      productId,
      published: true,
    },
    _avg: {
      rating: true,
    },
    _count: {
      id: true,
    },
  });

  return {
    count: aggregate._count.id,
    averageRating: aggregate._avg.rating ?? 0,
  };
}
