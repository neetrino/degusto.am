'use client';

import { t } from '../../lib/i18n';
import type { LanguageCode } from '../../lib/language';

interface CarouselNavigationProps {
  language: LanguageCode;
  onPrevious: () => void;
  onNext: () => void;
}

/** Navigation arrows for carousel */
export function CarouselNavigation({ language, onPrevious, onNext }: CarouselNavigationProps) {
  return (
    <>
      <button
        onClick={onPrevious}
        className="absolute left-0 top-1/2 z-20 hidden -translate-x-12 -translate-y-1/2 transform cursor-pointer rounded-full bg-white/90 p-2 text-gray-900 shadow-lg transition-all hover:scale-110 hover:bg-white lg:block"
        aria-label={t(language, 'product.carouselPrevious')}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <button
        onClick={onNext}
        className="absolute right-0 top-1/2 z-20 hidden translate-x-12 -translate-y-1/2 transform cursor-pointer rounded-full bg-white/90 p-2 text-gray-900 shadow-lg transition-all hover:scale-110 hover:bg-white lg:block"
        aria-label={t(language, 'product.carouselNext')}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </>
  );
}
