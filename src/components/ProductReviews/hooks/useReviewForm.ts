'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../../../lib/auth/AuthContext';
import { useTranslation } from '../../../lib/i18n-client';
import { apiClient } from '../../../lib/api-client';
import type { Review } from '../utils';
import { logger } from "@/lib/utils/logger";

interface UseReviewFormProps {
  productId?: string;
  productSlug?: string;
  reviews: Review[];
  setReviews: (reviews: Review[] | ((prev: Review[]) => Review[])) => void;
  onReviewUpdated?: () => void;
}

/**
 * Hook for managing review form state and submission
 */
export function useReviewForm({
  productId,
  productSlug,
  reviews,
  setReviews,
  onReviewUpdated,
}: UseReviewFormProps) {
  const { isLoggedIn, user } = useAuth();
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  const handleEditReview = (review: Review) => {
    setEditingReviewId(review.id);
    setRating(review.rating);
    setComment(review.comment || '');
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setRating(0);
    setComment('');
    setShowForm(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      alert(t('common.reviews.loginRequired'));
      return;
    }

    if (rating === 0) {
      alert(t('common.reviews.ratingRequired'));
      return;
    }

    if (!comment.trim()) {
      alert(t('common.reviews.commentRequired'));
      return;
    }

    setSubmitting(true);

    try {
      // Use slug if available, otherwise fall back to productId
      const identifier = productSlug || productId;
      if (!identifier) {
        alert(t('common.reviews.submitError'));
        return;
      }

      logger.debug('📝 [PRODUCT REVIEWS] Submitting review:', { identifier, rating, commentLength: comment.length });
      
      const newReview = await apiClient.post<Review>(`/api/v1/products/${identifier}/reviews`, {
        rating,
        comment: comment.trim(),
      });

      logger.debug('✅ [PRODUCT REVIEWS] Review submitted successfully:', newReview.id);

      // Add new review to the list
      setReviews([newReview, ...reviews]);
      setRating(0);
      setComment('');
      setShowForm(false);
      
      // Dispatch event to update rating on product page
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('review-updated'));
      }
      
      onReviewUpdated?.();
    } catch (error: unknown) {
      console.error('❌ [PRODUCT REVIEWS] Error submitting review:', error);
      
      const err = error as { status?: number };
      
      // Handle specific error cases
      if (err.status === 409) {
        // User already has a review - load it and show in edit mode
        try {
          const identifier = productSlug || productId;
          if (!identifier) {
            alert(t('common.reviews.alreadyReviewed'));
            return;
          }

          logger.debug('📝 [PRODUCT REVIEWS] Loading existing review for user');
          const existingReview = await apiClient.get<Review>(`/api/v1/products/${identifier}/reviews?my=true`);
          
          if (existingReview) {
            // Add to reviews list if not already there
            const reviewExists = reviews.some(r => r.id === existingReview.id);
            if (!reviewExists) {
              setReviews([existingReview, ...reviews]);
            }

            // Seamless UX: apply current form values as an update to existing review.
            const updatedReview = await apiClient.put<Review>(`/api/v1/reviews/${existingReview.id}`, {
              rating,
              comment: comment.trim(),
            });
            setReviews((prev) => prev.map((item) => (item.id === updatedReview.id ? updatedReview : item)));
            setRating(0);
            setComment('');
            setShowForm(false);
            setEditingReviewId(null);
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('review-updated'));
            }
            onReviewUpdated?.();
            alert(t('common.reviews.updatedAfterConflict'));
          } else {
            alert(t('common.reviews.alreadyReviewed'));
          }
        } catch (loadError: unknown) {
          console.error('❌ [PRODUCT REVIEWS] Error loading existing review:', loadError);
          const userReview = user ? reviews.find(r => r.userId === user.id) : null;
          if (userReview) {
            handleEditReview(userReview);
            alert(t('common.reviews.alreadyReviewedEditable'));
          } else {
            alert(t('common.reviews.alreadyReviewed'));
          }
        }
      } else if (err.status === 401) {
        alert(t('common.reviews.loginRequired'));
      } else {
        alert(t('common.reviews.submitError'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateReview = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!isLoggedIn || !editingReviewId) {
      return;
    }

    if (rating === 0) {
      alert(t('common.reviews.ratingRequired'));
      return;
    }

    if (!comment.trim()) {
      alert(t('common.reviews.commentRequired'));
      return;
    }

    setSubmitting(true);

    try {
      logger.debug('📝 [PRODUCT REVIEWS] Updating review:', { reviewId: editingReviewId, rating, commentLength: comment.length });
      
      const updatedReview = await apiClient.put<Review>(`/api/v1/reviews/${editingReviewId}`, {
        rating,
        comment: comment.trim(),
      });

      logger.debug('✅ [PRODUCT REVIEWS] Review updated successfully:', updatedReview.id);

      // Update review in the list
      setReviews(reviews.map(r => r.id === editingReviewId ? updatedReview : r));
      setRating(0);
      setComment('');
      setEditingReviewId(null);
      setShowForm(false);
      
      // Dispatch event to update rating on product page
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('review-updated'));
      }
      
      onReviewUpdated?.();
    } catch (error: unknown) {
      console.error('❌ [PRODUCT REVIEWS] Error updating review:', error);
      
      const err = error as { status?: number };
      
      // Handle specific error cases
      if (err.status === 401) {
        alert(t('common.reviews.loginRequired'));
      } else if (err.status === 403) {
        alert(t('common.reviews.updateOwnReviewOnly'));
      } else {
        alert(t('common.reviews.submitError'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (review: Review) => {
    if (!isLoggedIn) {
      alert(t('common.reviews.loginRequired'));
      return;
    }

    if (!window.confirm(t('common.reviews.confirmDeleteReview'))) {
      return;
    }

    setDeletingReviewId(review.id);

    try {
      logger.debug('📝 [PRODUCT REVIEWS] Deleting review:', { reviewId: review.id });

      await apiClient.delete<{ success: boolean }>(`/api/v1/reviews/${review.id}`);

      logger.debug('✅ [PRODUCT REVIEWS] Review deleted successfully:', review.id);

      setReviews((prev) => prev.filter((r) => r.id !== review.id));

      if (editingReviewId === review.id) {
        setEditingReviewId(null);
        setRating(0);
        setComment('');
        setShowForm(false);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('review-updated'));
      }

      onReviewUpdated?.();
    } catch (error: unknown) {
      console.error('❌ [PRODUCT REVIEWS] Error deleting review:', error);

      const err = error as { status?: number };

      if (err.status === 401) {
        alert(t('common.reviews.loginRequired'));
      } else if (err.status === 403) {
        alert(t('common.reviews.deleteOwnReviewOnly'));
      } else {
        alert(t('common.reviews.deleteReviewError'));
      }
    } finally {
      setDeletingReviewId(null);
    }
  };

  return {
    showForm,
    setShowForm,
    rating,
    setRating,
    hoveredRating,
    setHoveredRating,
    comment,
    setComment,
    submitting,
    deletingReviewId,
    editingReviewId,
    handleEditReview,
    handleCancelEdit,
    handleSubmit,
    handleUpdateReview,
    handleDeleteReview,
  };
}




