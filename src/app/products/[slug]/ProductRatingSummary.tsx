'use client';

import { r2Asset } from '@/lib/r2-public-url';
import {
  PDP_RATING_STAR_GAP_CLASS,
  PDP_RATING_STAR_SIZE_CLASS,
} from '@/constants/pdp-figma-tokens';

const PDP_RATING_STAR_SRC = r2Asset('product/20260512-7jf6Wihrew.svg');

export interface ProductRatingSummaryProps {
  averageRating: number;
  reviewsCount: number;
}

export function ProductRatingSummary({
  averageRating,
  reviewsCount,
}: ProductRatingSummaryProps) {
  const effectiveRating = reviewsCount > 0 ? averageRating : 5;
  const filledStars = Math.min(5, Math.max(0, Math.round(effectiveRating)));

  return (
    <div className={`mb-5 flex items-center ${PDP_RATING_STAR_GAP_CLASS}`} aria-hidden>
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
  );
}
