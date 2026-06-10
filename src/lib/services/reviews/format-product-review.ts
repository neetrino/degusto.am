export type ProductReviewListItem = {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  published: boolean;
};

type ReviewWithUser = {
  id: string;
  userId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  published: boolean;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
};

/** Maps a Prisma review row to the storefront list shape. */
export function formatProductReview(review: ReviewWithUser): ProductReviewListItem {
  return {
    id: review.id,
    userId: review.userId,
    userName:
      review.user.firstName && review.user.lastName
        ? `${review.user.firstName} ${review.user.lastName}`
        : review.user.firstName || review.user.lastName || "Anonymous",
    rating: review.rating,
    comment: review.comment || "",
    createdAt: review.createdAt.toISOString(),
    published: review.published,
  };
}
