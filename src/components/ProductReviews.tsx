'use client';

import type { Dispatch, SetStateAction } from 'react';
import { useAuth } from '../lib/auth/AuthContext';
import { useTranslation } from '../lib/i18n-client';
import { useReviewForm } from './ProductReviews/hooks/useReviewForm';
import type { Review } from './ProductReviews/utils';
import { ReviewSummary } from './ProductReviews/ReviewSummary';
import { ReviewForm } from './ProductReviews/ReviewForm';
import { ReviewList } from './ProductReviews/ReviewList';
import { ProductReviewsLoading } from './ProductReviews/ProductReviewsLoading';
import {
  PDP_FIGMA_ORANGE,
  PDP_FIGMA_TEXT,
  PDP_MAIN_RADIUS_CLASS,
  PDP_PILL_RADIUS_CLASS,
} from '@/constants/pdp-figma-tokens';

interface ProductReviewsProps {
  productId: string;
  productSlug: string;
  reviews: Review[];
  reviewsLoading: boolean;
  setReviews: Dispatch<SetStateAction<Review[]>>;
}

export function ProductReviews({
  productId,
  productSlug,
  reviews,
  reviewsLoading,
  setReviews,
}: ProductReviewsProps) {
  const { isLoggedIn, user } = useAuth();
  const { t } = useTranslation();
  
  const {
    showForm,
    setShowForm,
    rating,
    setRating,
    hoveredRating,
    setHoveredRating,
    comment,
    setComment,
    submitting,
    editingReviewId,
    handleEditReview,
    handleCancelEdit,
    handleSubmit,
    handleUpdateReview,
  } = useReviewForm({
    productId,
    productSlug,
    reviews,
    setReviews,
  });

  // Get user's review if exists
  const userReview = user ? reviews.find(r => r.userId === user.id) : null;

  if (reviewsLoading) {
    return <ProductReviewsLoading />;
  }

  const handleShowForm = () => {
    if (!isLoggedIn) {
      alert(t('common.reviews.loginRequired'));
      return;
    }
    setShowForm(true);
  };

  const handleLoginRequired = () => {
    alert(t('common.reviews.loginRequired'));
  };

  return (
    <div className={`mx-auto max-w-7xl bg-white px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12 ${PDP_MAIN_RADIUS_CLASS}`}>
      <div className="mb-8">
        <h2
          className="mb-6 text-[28px] font-bold sm:text-[29px]"
          style={{ color: PDP_FIGMA_TEXT }}
        >
          {t('common.reviews.title')}
        </h2>

        <ReviewSummary reviews={reviews} />

        {!showForm && (
          <button
            type="button"
            onClick={handleShowForm}
            className={`mb-8 h-12 px-8 text-base font-medium text-white transition hover:brightness-95 ${PDP_PILL_RADIUS_CLASS}`}
            style={{ backgroundColor: PDP_FIGMA_ORANGE }}
          >
            {t('common.reviews.writeReview')}
          </button>
        )}

        {/* Review Form */}
        {showForm && (
          <ReviewForm
            rating={rating}
            hoveredRating={hoveredRating}
            comment={comment}
            submitting={submitting}
            editingReviewId={editingReviewId}
            onRatingChange={setRating}
            onHover={setHoveredRating}
            onCommentChange={setComment}
            onSubmit={editingReviewId ? handleUpdateReview : handleSubmit}
            onCancel={editingReviewId ? handleCancelEdit : () => {
              setShowForm(false);
              setRating(0);
              setComment('');
            }}
          />
        )}
      </div>

      {/* Reviews List */}
      <ReviewList
        reviews={reviews}
        currentUserId={user?.id}
        showForm={showForm}
        onEditReview={handleEditReview}
        onShowForm={handleShowForm}
        onLoginRequired={handleLoginRequired}
      />
    </div>
  );
}


