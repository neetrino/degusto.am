import { ShopDesktopProductsSkeleton } from './ShopDesktopProductsSkeleton';
import { UNIVERSAL_HEADER_STICKY_SIDEBAR_CLASS } from '@/constants/universal-header-layout';
import {
  STOREFRONT_DESKTOP_MAIN_COLUMN_CLASS,
  STOREFRONT_DESKTOP_SHOP_SECTION_CLASS,
  STOREFRONT_DESKTOP_SIDEBAR_GAP_CLASS,
  STOREFRONT_DESKTOP_SIDEBAR_WIDTH_CLASS,
} from '@/constants/storefront-desktop-layout';

/** Visible route loading state for shop/combo while server data resolves. */
export function StorefrontMenuPageLoading() {
  return (
    <div className="min-h-screen bg-white" aria-busy="true" aria-label="Loading menu">
      <div className="hidden bg-white pb-20 pt-5 lg:block">
        <div className={`${STOREFRONT_DESKTOP_SHOP_SECTION_CLASS} flex min-w-0 ${STOREFRONT_DESKTOP_SIDEBAR_GAP_CLASS}`}>
          <aside
            className={`${UNIVERSAL_HEADER_STICKY_SIDEBAR_CLASS} ${STOREFRONT_DESKTOP_SIDEBAR_WIDTH_CLASS} animate-pulse rounded-[20px] bg-[#1a1a1a]`}
            aria-hidden
          />
          <section className={STOREFRONT_DESKTOP_MAIN_COLUMN_CLASS}>
            <div className="mb-[42px] mt-10 space-y-3" aria-hidden>
              <div className="h-12 w-64 animate-pulse rounded-[20px] bg-[#fde8d8]" />
              <div className="h-5 w-80 animate-pulse rounded-full bg-[#f3f3f5]" />
            </div>
            <ShopDesktopProductsSkeleton />
          </section>
        </div>
      </div>

      <div className="space-y-4 px-4 pb-8 pt-6 lg:hidden" aria-hidden>
        <div className="h-10 w-40 animate-pulse rounded-[20px] bg-[#fde8d8]" />
        <div className="h-4 w-56 animate-pulse rounded-full bg-[#f3f3f5]" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-[220px] animate-pulse rounded-[20px] bg-[#f3f3f5]" />
          ))}
        </div>
      </div>
    </div>
  );
}
