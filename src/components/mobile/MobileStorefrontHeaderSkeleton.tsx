import {
  MOBILE_FIGMA_HEADER_HORIZONTAL_INSET_CLASS,
  MOBILE_FIGMA_HEADER_SEARCH_STACKING_CLASS,
  MOBILE_FIGMA_HEADER_STACKING_CLASS,
  MOBILE_FIGMA_HEADER_TOP_ROW_STACKING_CLASS,
} from '@/constants/mobile-figma-storefront';
import { STOREFRONT_SKELETON_PULSE_CLASS } from '@/components/routing/storefront-skeleton.constants';

/** Mobile storefront header placeholder while search params hydrate. */
export function MobileStorefrontHeaderSkeleton() {
  return (
    <header
      className={`relative overflow-visible ${MOBILE_FIGMA_HEADER_STACKING_CLASS} ${MOBILE_FIGMA_HEADER_HORIZONTAL_INSET_CLASS} shrink-0 pt-[58px] lg:hidden`}
      aria-hidden
    >
      <div
        className={`relative overflow-visible ${MOBILE_FIGMA_HEADER_TOP_ROW_STACKING_CLASS} flex translate-y-[20px] items-start justify-between`}
      >
        <div className={`h-[46px] w-[129px] rounded-lg ${STOREFRONT_SKELETON_PULSE_CLASS}`} />
        <div className="flex items-center gap-1">
          <div className={`h-12 w-12 rounded-full ${STOREFRONT_SKELETON_PULSE_CLASS}`} />
          <div className={`h-12 w-12 rounded-full ${STOREFRONT_SKELETON_PULSE_CLASS}`} />
        </div>
      </div>
      <div
        className={`relative ${MOBILE_FIGMA_HEADER_SEARCH_STACKING_CLASS} mt-[8px] h-12 translate-y-[20px] rounded-[30px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.05)] ${STOREFRONT_SKELETON_PULSE_CLASS}`}
      />
    </header>
  );
}
