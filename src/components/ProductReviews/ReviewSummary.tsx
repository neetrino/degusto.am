'use client';

import { ReviewRating } from './ReviewRating';
import { calculateAverageRating, calculateRatingDistribution, type Review } from './utils';
import { useTranslation } from '../../lib/i18n-client';
import { montserratArmFont } from '@/fonts/montserrat-arm-font';
import {
  PDP_FIGMA_ORANGE,
  PDP_FIGMA_PROGRESS_TRACK,
  PDP_REVIEWS_BAR_HEIGHT_CLASS,
  PDP_REVIEWS_BAR_LABEL_CLASS,
  PDP_REVIEWS_BAR_LABEL_GAP_CLASS,
  PDP_REVIEWS_BAR_RADIUS_CLASS,
  PDP_REVIEWS_BAR_ROWS_GAP_CLASS,
  PDP_REVIEWS_BARS_OFFSET_CLASS,
  PDP_REVIEWS_COUNT_CLASS,
  PDP_REVIEWS_SCORE_CLASS,
} from '@/constants/pdp-figma-tokens';

interface ReviewSummaryProps {
  reviews: Review[];
}

/**
 * Rating summary and distribution — Figma node 10:2231 (bars left, score right).
 */
export function ReviewSummary({ reviews }: ReviewSummaryProps) {
  const { t } = useTranslation();
  const averageRating = calculateAverageRating(reviews);
  const ratingDistribution = calculateRatingDistribution(reviews).reverse();
  const displayRating = reviews.length > 0 ? averageRating : 5;

  return (
    <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:gap-x-12 lg:gap-x-16">
      <div
        className={`order-2 flex flex-col ${PDP_REVIEWS_BAR_ROWS_GAP_CLASS} ${PDP_REVIEWS_BARS_OFFSET_CLASS} md:order-1`}
      >
        {ratingDistribution.map(({ star, percentage }) => (
          <div key={star} className={`flex items-center ${PDP_REVIEWS_BAR_LABEL_GAP_CLASS}`}>
            <span className={PDP_REVIEWS_BAR_LABEL_CLASS}>{star}</span>
            <div
              className={`${PDP_REVIEWS_BAR_HEIGHT_CLASS} min-w-0 flex-1 overflow-hidden ${PDP_REVIEWS_BAR_RADIUS_CLASS}`}
              style={{ backgroundColor: PDP_FIGMA_PROGRESS_TRACK }}
            >
              <div
                className={`${PDP_REVIEWS_BAR_HEIGHT_CLASS} ${PDP_REVIEWS_BAR_RADIUS_CLASS} transition-[width] duration-500`}
                style={{ width: `${percentage}%`, backgroundColor: PDP_FIGMA_ORANGE }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="order-1 flex flex-col items-center md:order-2 md:items-end md:text-right">
        <div className={PDP_REVIEWS_SCORE_CLASS}>{displayRating.toFixed(1)}</div>
        <ReviewRating
          rating={Math.round(displayRating)}
          hoveredRating={0}
          onRatingChange={() => {}}
          onHover={() => {}}
          size="lg"
          interactive={false}
          starColor={PDP_FIGMA_ORANGE}
        />
        <div className={`${PDP_REVIEWS_COUNT_CLASS} ${montserratArmFont.className}`}>
          {reviews.length}{' '}
          {reviews.length === 1 ? t('common.reviews.review') : t('common.reviews.reviews')}
        </div>
      </div>
    </div>
  );
}
