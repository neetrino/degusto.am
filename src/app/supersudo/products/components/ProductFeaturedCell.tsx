'use client';

import type { MouseEvent } from 'react';
import { useTranslation } from '@/lib/i18n-client';

type ProductFeaturedCellProps = {
  isDailyOffer: boolean;
  featured: boolean;
  togglingDailyOffer: boolean;
  onToggleFeatured: (event: MouseEvent<HTMLButtonElement>) => void;
  onToggleDailyOffer: (event: MouseEvent<HTMLButtonElement>) => void;
};

export function ProductFeaturedCell({
  isDailyOffer,
  featured,
  togglingDailyOffer,
  onToggleFeatured,
  onToggleDailyOffer,
}: ProductFeaturedCellProps) {
  const { t } = useTranslation();

  return (
    <div className="inline-flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={onToggleFeatured}
        className="inline-flex h-8 w-8 items-center justify-center rounded transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        title={featured ? t('admin.products.clickToRemoveFeatured') : t('admin.products.clickToMarkFeatured')}
      >
        <svg
          className={`h-6 w-6 transition-all duration-200 ${
            featured
              ? 'fill-blue-500 text-blue-500 drop-shadow-sm'
              : 'fill-none stroke-blue-400 text-blue-400 opacity-50 hover:opacity-75'
          }`}
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      </button>
      <button
        type="button"
        disabled={togglingDailyOffer}
        onClick={onToggleDailyOffer}
        className="inline-flex h-8 w-8 items-center justify-center rounded transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        title={
          isDailyOffer
            ? t('admin.products.dailyOffer.removeActive')
            : t('admin.products.dailyOffer.setActive')
        }
        aria-label={
          isDailyOffer
            ? t('admin.products.dailyOffer.removeActive')
            : t('admin.products.dailyOffer.setActive')
        }
        aria-pressed={isDailyOffer}
      >
        <svg
          className={`h-5 w-5 transition-all duration-200 ${
            isDailyOffer
              ? 'fill-emerald-500 text-emerald-500 drop-shadow-sm'
              : 'fill-none stroke-emerald-500 text-emerald-500 opacity-50 hover:opacity-75'
          }`}
          viewBox="0 0 24 24"
          strokeWidth="1.8"
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </button>
    </div>
  );
}
