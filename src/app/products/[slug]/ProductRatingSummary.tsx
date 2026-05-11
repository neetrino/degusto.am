'use client';

import { t } from '../../../lib/i18n';
import type { LanguageCode } from '../../../lib/language';

const STAR_PATH =
  'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z';

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
  const fillPercent = Math.min(100, Math.max(0, (effectiveRating / 5) * 100));
  const reviewLabel =
    reviewsCount === 1
      ? t(language, 'common.reviews.review')
      : t(language, 'common.reviews.reviews');

  return (
    <div className="flex items-center gap-2 flex-wrap mb-5">
      <div className="relative h-7 w-7 shrink-0" aria-hidden>
        <svg
          className="absolute inset-0 h-7 w-7 text-gray-200"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d={STAR_PATH} />
        </svg>
        <div
          className="absolute left-0 top-0 bottom-0 overflow-hidden"
          style={{ width: `${fillPercent}%` }}
        >
          <svg
            className="h-7 w-7 shrink-0 text-amber-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d={STAR_PATH} />
          </svg>
        </div>
      </div>
      <span className="text-sm font-semibold text-gray-900 tabular-nums">
        {effectiveRating.toFixed(1)}
      </span>
      <button
        type="button"
        onClick={onReviewsClick}
        className="text-sm text-gray-600 hover:text-gray-900 hover:underline transition-colors"
        aria-label={`${reviewsCount} ${reviewLabel}`}
      >
        ({reviewsCount} {reviewLabel})
      </button>
    </div>
  );
}
