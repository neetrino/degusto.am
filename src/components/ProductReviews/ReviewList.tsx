'use client';

import { ReviewItem } from './ReviewItem';
import type { Review } from './utils';

interface ReviewListProps {
  reviews: Review[];
  currentUserId?: string;
  onEditReview: (review: Review) => void;
  onDeleteReview: (review: Review) => void;
  deletingReviewId?: string | null;
}

/**
 * Reviews list component
 */
export function ReviewList({
  reviews,
  currentUserId,
  onEditReview,
  onDeleteReview,
  deletingReviewId = null,
}: ReviewListProps) {
  if (reviews.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <ReviewItem
          key={review.id}
          review={review}
          currentUserId={currentUserId}
          onEdit={onEditReview}
          onDelete={onDeleteReview}
          isDeleting={deletingReviewId === review.id}
        />
      ))}
    </div>
  );
}




