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
  PDP_REVIEWS_PANEL_CLASS,
  PDP_REVIEWS_SUMMARY_GAP_CLASS,
  PDP_REVIEWS_TITLE_CLASS,
  PDP_REVIEWS_WRITE_BUTTON_CLASS,
  PDP_REVIEWS_WRITE_BUTTON_WRAP_CLASS,
} from '@/constants/pdp-figma-tokens';
import { montserratArmFont } from '@/fonts/montserrat-arm-font';

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
    handleDeleteReview,
    deletingReviewId,
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

  return (
    <div className={`${PDP_REVIEWS_PANEL_CLASS} ${montserratArmFont.className}`}>
      <div className={`mb-8 flex flex-col ${PDP_REVIEWS_SUMMARY_GAP_CLASS}`}>
        <h2 className={PDP_REVIEWS_TITLE_CLASS}>{t('common.reviews.title')}</h2>

        <ReviewSummary reviews={reviews} />

        {!showForm && (
          <div className={PDP_REVIEWS_WRITE_BUTTON_WRAP_CLASS}>
            <button
              type="button"
              onClick={handleShowForm}
              className={PDP_REVIEWS_WRITE_BUTTON_CLASS}
            >
              {t('common.reviews.writeReview')}
            </button>
          </div>
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
        onEditReview={handleEditReview}
        onDeleteReview={handleDeleteReview}
        deletingReviewId={deletingReviewId}
      />
    </div>
  );
}


