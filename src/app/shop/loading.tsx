import { MobileShopProductsLoading } from '../../components/home/MobileShopProductsLoading';
import { ShopDesktopProductsSkeleton } from '../../components/home/ShopDesktopProductsSkeleton';

export default function ShopLoading() {
  return (
    <>
      <MobileShopProductsLoading />
      <div className="hidden bg-white pb-20 pt-5 lg:block" aria-busy="true">
        <div className="mx-auto flex w-full max-w-[1470px] gap-8 px-3">
          <aside className="sticky top-[116px] h-[calc(100vh-132px)] w-[320px] shrink-0 rounded-[20px] bg-black" />
          <section className="flex-1 pt-10">
            <div className="mb-[42px] h-[80px] animate-pulse rounded-[20px] bg-[#f3f3f5]" />
            <ShopDesktopProductsSkeleton />
          </section>
        </div>
      </div>
    </>
  );
}
