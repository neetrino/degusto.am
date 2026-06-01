'use client';

import { ProductInfoColumnSkeleton } from './ProductInfoColumnSkeleton';
import {
  PDP_HERO_FRAME_CLASS,
  PDP_HERO_GRID_CLASS,
  PDP_HERO_IMAGE_OFFSET_CLASS,
  PDP_HERO_INFO_OFFSET_CLASS,
  PDP_IMAGE_RADIUS_CLASS,
  PDP_MAIN_IMAGE_ASPECT_CLASS,
  PDP_MAIN_IMAGE_MAX_WIDTH_CLASS,
  STOREFRONT_DESKTOP_CONTENT_CLASS,
} from '@/constants/pdp-figma-tokens';

/**
 * Initial PDP skeleton before first visual payload (stable min-height to limit CLS).
 */
export function ProductPageShell() {
  return (
    <div
      className={`${STOREFRONT_DESKTOP_CONTENT_CLASS} max-lg:px-4 max-lg:py-6 px-4 py-12 min-h-[min(100dvh,720px)] sm:px-6 lg:px-0 lg:py-10`}
      aria-busy="true"
      aria-label="Product loading"
    >
      <section className={`${PDP_HERO_FRAME_CLASS} max-lg:p-4 sm:max-lg:p-6 lg:p-0`}>
        <div className={PDP_HERO_GRID_CLASS}>
          <div className={`${PDP_HERO_IMAGE_OFFSET_CLASS} flex w-full flex-col gap-4`} aria-hidden>
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
