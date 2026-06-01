'use client';

import { useTranslation } from '../../lib/i18n-client';
import { PDP_REVIEWS_PANEL_CLASS } from '@/constants/pdp-figma-tokens';

/**
 * Loading state component for ProductReviews
 */
export function ProductReviewsLoading() {
  const { t } = useTranslation();

  return (
    <div
      className={`${PDP_REVIEWS_PANEL_CLASS} animate-pulse`}
      aria-busy="true"
      aria-label={t('common.messages.loading')}
    >
      <div className="mb-8 h-8 w-1/4 rounded bg-gray-200" />
      <div className="space-y-4">
        <div className="h-24 rounded bg-gray-200" />
        <div className="h-24 rounded bg-gray-200" />
      </div>
    </div>
  );
}
