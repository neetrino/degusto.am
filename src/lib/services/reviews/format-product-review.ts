import type { Prisma } from "@prisma/client";

export type ProductReviewListItem = {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  published: boolean;
};

type ReviewWithUser = Prisma.ProductReviewGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
        email: true;
      };
    };
  };
}>;

/** Maps a Prisma review row to the storefront list shape. */
export function formatProductReview(review: ReviewWithUser): ProductReviewListItem {
  return {
    id: review.id,
    userId: review.userId,
    userName:
      review.user.firstName && review.user.lastName
        ? `${review.user.firstName} ${review.user.lastName}`
        : review.user.firstName || review.user.lastName || review.user.email || "Anonymous",
    rating: review.rating,
    comment: review.comment || "",
    createdAt: review.createdAt.toISOString(),
    published: review.published,
  };
}
