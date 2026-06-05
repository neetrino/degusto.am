import { STOREFRONT_DESKTOP_PRODUCT_GRID_CLASS } from '@/constants/storefront-desktop-layout';

/** Desktop shop product grid skeleton while category products load. */
export function ShopDesktopProductsSkeleton() {
  return (
    <div className={STOREFRONT_DESKTOP_PRODUCT_GRID_CLASS} aria-busy="true" aria-hidden>
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="h-[330px] animate-pulse rounded-[20px] border-[1.5px] border-[#ededed] bg-[#f7f7f8]"
        />
      ))}
    </div>
  );
}
