'use client';

import { ReviewRating } from './ReviewRating';
import { calculateAverageRating, calculateRatingDistribution, type Review } from './utils';
import { useTranslation } from '../../lib/i18n-client';
import {
  PDP_FIGMA_MUTED,
  PDP_FIGMA_ORANGE,
  PDP_FIGMA_PROGRESS_TRACK,
  PDP_FIGMA_TEXT,
} from '@/constants/pdp-figma-tokens';

interface ReviewSummaryProps {
  reviews: Review[];
}

/**
 * Rating summary and distribution — Figma PDP layout (bars left, score right).
 */
export function ReviewSummary({ reviews }: ReviewSummaryProps) {
  const { t } = useTranslation();
  const averageRating = calculateAverageRating(reviews);
  const ratingDistribution = calculateRatingDistribution(reviews);
  const displayRating = reviews.length > 0 ? averageRating : 5;

  return (
    <div className="mb-8 grid grid-cols-1 items-start gap-8 md:grid-cols-[1fr_auto] md:gap-12">
      <div className="order-2 md:order-1">
        {ratingDistribution.map(({ star, percentage }) => (
          <div key={star} className="mb-2 flex items-center gap-5 last:mb-0">
            <span className="w-4 shrink-0 text-center text-lg font-bold text-[#aaa]">{star}</span>
            <div
              className="h-[14px] flex-1 overflow-hidden rounded-full"
              style={{ backgroundColor: PDP_FIGMA_PROGRESS_TRACK }}
            >
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${percentage}%`, backgroundColor: PDP_FIGMA_ORANGE }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="order-1 flex flex-col items-center md:order-2 md:items-end md:text-right">
        <div
          className="text-[64px] font-semibold leading-none sm:text-[80px]"
          style={{ color: PDP_FIGMA_TEXT }}
        >
          {displayRating.toFixed(1)}
        </div>
        <ReviewRating
          rating={Math.round(displayRating)}
          hoveredRating={0}
          onRatingChange={() => {}}
          onHover={() => {}}
          size="lg"
          interactive={false}
          starColor={PDP_FIGMA_ORANGE}
        />
        <div className="mt-3 text-lg" style={{ color: PDP_FIGMA_MUTED }}>
          {reviews.length}{' '}
          {reviews.length === 1 ? t('common.reviews.review') : t('common.reviews.reviews')}
        </div>
      </div>
    </div>
  );
}
