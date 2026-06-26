import { STOREFRONT_PAGE_CONTAINER_CLASS } from '@/constants/storefront-desktop-layout';
import { MOBILE_SHOP_PRODUCTS_GRID_CLASS } from '@/constants/mobile-figma-storefront';
import { STOREFRONT_SKELETON_PULSE_CLASS } from '@/components/routing/storefront-skeleton.constants';

type WishlistPageLoadingProps = {
  ariaLabel?: string;
};

/** Wishlist — product card grid skeleton. */
export function WishlistPageLoading({ ariaLabel = 'Loading wishlist' }: WishlistPageLoadingProps) {
  return (
    <div className={`${STOREFRONT_PAGE_CONTAINER_CLASS} py-6`} aria-busy="true" aria-label={ariaLabel}>
      <div className={`mb-8 hidden items-center justify-between lg:flex`}>
        <div className={`h-8 w-56 rounded ${STOREFRONT_SKELETON_PULSE_CLASS}`} />
        <div className={`h-10 w-40 rounded-full ${STOREFRONT_SKELETON_PULSE_CLASS}`} />
      </div>
      <div className={MOBILE_SHOP_PRODUCTS_GRID_CLASS}>
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className={`h-[280px] rounded-[24px] ${STOREFRONT_SKELETON_PULSE_CLASS}`}
          />
        ))}
      </div>
    </div>
  );
}
