import { ShopDesktopProductsSkeleton } from '@/components/home/ShopDesktopProductsSkeleton';
import { MOBILE_SHOP_PRODUCTS_GRID_CLASS } from '@/constants/mobile-figma-storefront';
import { STOREFRONT_SKELETON_PULSE_CLASS } from './storefront-skeleton.constants';

type ShopMenuRouteLoadingFallbackProps = {
  ariaLabel?: string;
};

/** Shop / combo route loading UI with visible mobile + desktop skeletons. */
export function ShopMenuRouteLoadingFallback({
  ariaLabel = 'Loading menu',
}: ShopMenuRouteLoadingFallbackProps) {
  return (
    <div className="min-h-[480px] bg-white" aria-busy="true" aria-label={ariaLabel}>
      <div className={`${MOBILE_SHOP_PRODUCTS_GRID_CLASS} px-4 py-6 lg:hidden`}>
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className={`h-[220px] rounded-[24px] ${STOREFRONT_SKELETON_PULSE_CLASS}`}
          />
        ))}
      </div>
      <div className="hidden px-4 py-8 lg:block">
        <div className={`mb-6 h-10 w-48 rounded-lg ${STOREFRONT_SKELETON_PULSE_CLASS}`} />
        <ShopDesktopProductsSkeleton />
      </div>
    </div>
  );
}
