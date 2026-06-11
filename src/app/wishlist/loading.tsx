import { STOREFRONT_PAGE_CONTAINER_CLASS } from '@/constants/storefront-desktop-layout';
import { MOBILE_SHOP_PRODUCTS_GRID_CLASS } from '@/constants/mobile-figma-storefront';

export default function WishlistPageLoading() {
  return (
    <div className={`${STOREFRONT_PAGE_CONTAINER_CLASS} py-6`} aria-busy="true" aria-label="Loading wishlist">
      <div className="mb-8 hidden items-center justify-between lg:flex">
        <div className="h-8 w-56 animate-pulse rounded bg-[#f3f3f3]" />
        <div className="h-10 w-40 animate-pulse rounded-full bg-[#f3f3f3]" />
      </div>
      <div className={MOBILE_SHOP_PRODUCTS_GRID_CLASS}>
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="h-[280px] animate-pulse rounded-[24px] bg-[#f8f8f8]" />
        ))}
      </div>
    </div>
  );
}
