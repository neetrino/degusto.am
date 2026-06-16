'use client';

import { r2Asset } from '@/lib/r2-public-url';
import {
  PDP_RATING_STAR_GAP_CLASS,
  PDP_RATING_STAR_SIZE_CLASS,
} from '@/constants/pdp-figma-tokens';
import { RatingStars } from '@/components/RatingStars';

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

  return (
    <RatingStars
      rating={effectiveRating}
      starSrc={PDP_RATING_STAR_SRC}
      className={`mb-5 flex items-center ${PDP_RATING_STAR_GAP_CLASS}`}
      starClassName={PDP_RATING_STAR_SIZE_CLASS}
    />
  );
}
