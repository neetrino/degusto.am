'use client';

import { useTranslation } from '../../../lib/i18n-client';
import { ProductInfoColumnSkeleton } from './ProductInfoColumnSkeleton';
import {
  PDP_HERO_FRAME_CLASS,
  PDP_HERO_FRAME_SKELETON_MIN_HEIGHT_CLASS,
  PDP_HERO_GRID_CLASS,
  PDP_HERO_IMAGE_OFFSET_CLASS,
  PDP_HERO_INFO_OFFSET_CLASS,
  PDP_IMAGE_RADIUS_CLASS,
  PDP_MAIN_IMAGE_ASPECT_CLASS,
  PDP_MAIN_IMAGE_MAX_WIDTH_CLASS,
  PDP_MOBILE_MAIN_IMAGE_BLEED_CLASS,
  PDP_MOBILE_HERO_INSET_CLASS,
  PDP_MOBILE_SHELL_BLEED_CLASS,
  STOREFRONT_DESKTOP_CONTENT_CLASS,
} from '@/constants/pdp-figma-tokens';

/**
 * Initial PDP skeleton before first visual payload (stable min-height to limit CLS).
 */
export function ProductPageShell() {
  const { t } = useTranslation();

  return (
    <div
      className={`${STOREFRONT_DESKTOP_CONTENT_CLASS} ${PDP_MOBILE_SHELL_BLEED_CLASS} min-h-[min(100dvh,720px)] py-12 lg:px-0 lg:py-10`}
      aria-busy="true"
      aria-label={t('product.loadingAria')}
    >
      <section className={`${PDP_HERO_FRAME_CLASS} ${PDP_HERO_FRAME_SKELETON_MIN_HEIGHT_CLASS} ${PDP_MOBILE_HERO_INSET_CLASS} lg:p-0`}>
        <div className={PDP_HERO_GRID_CLASS}>
          <div
            className={`${PDP_HERO_IMAGE_OFFSET_CLASS} ${PDP_MOBILE_MAIN_IMAGE_BLEED_CLASS} flex w-full flex-col gap-4`}
            aria-hidden
          >
            <div
              className={`relative w-full animate-pulse bg-neutral-100 ${PDP_MAIN_IMAGE_MAX_WIDTH_CLASS} ${PDP_MAIN_IMAGE_ASPECT_CLASS} ${PDP_IMAGE_RADIUS_CLASS}`}
            />
          </div>
          <div className={PDP_HERO_INFO_OFFSET_CLASS}>
            <ProductInfoColumnSkeleton />
          </div>
        </div>
      </section>
    </div>
  );
}
