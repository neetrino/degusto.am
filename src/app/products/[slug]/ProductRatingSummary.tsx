'use client';

import { r2Asset } from '@/lib/r2-public-url';
import { t } from '../../../lib/i18n';
import type { LanguageCode } from '../../../lib/language';
import {
  PDP_RATING_REVIEW_COUNT_CLASS,
  PDP_RATING_ROW_GAP_CLASS,
  PDP_RATING_STAR_GAP_CLASS,
  PDP_RATING_STAR_SIZE_CLASS,
} from '@/constants/pdp-figma-tokens';

const PDP_RATING_STAR_SRC = r2Asset('product/20260512-7jf6Wihrew.svg');

export interface ProductRatingSummaryProps {
  averageRating: number;
  reviewsCount: number;
  onReviewsClick: () => void;
  language: LanguageCode;
}

export function ProductRatingSummary({
  averageRating,
  reviewsCount,
  onReviewsClick,
  language,
}: ProductRatingSummaryProps) {
  const effectiveRating = reviewsCount > 0 ? averageRating : 5;
  const filledStars = Math.min(5, Math.max(0, Math.round(effectiveRating)));
  const reviewLabel =
    reviewsCount === 1
      ? t(language, 'common.reviews.review')
      : t(language, 'common.reviews.reviews');

  return (
    <div className={`mb-5 flex flex-wrap items-center ${PDP_RATING_ROW_GAP_CLASS}`}>
      <div className={`flex items-center ${PDP_RATING_STAR_GAP_CLASS}`} aria-hidden>
        {Array.from({ length: 5 }, (_, index) => {
          const starNumber = index + 1;
          const isFilled = starNumber <= filledStars;
          return (
            <img
              key={starNumber}
              src={PDP_RATING_STAR_SRC}
              alt=""
              className={`${PDP_RATING_STAR_SIZE_CLASS} object-contain ${
                isFilled ? '' : 'opacity-35 grayscale'
              }`}
            />
          );
        })}
      </div>
      <button
        type="button"
        onClick={onReviewsClick}
        className={`${PDP_RATING_REVIEW_COUNT_CLASS} transition-opacity hover:opacity-80`}
        aria-label={`${reviewsCount} ${reviewLabel}`}
      >
        ({reviewsCount} {reviewLabel})
      </button>
    </div>
  );
}
