import { MobileShopProductsLoading } from '../../components/home/MobileShopProductsLoading';

export default function ShopLoading() {
  return (
    <>
      <MobileShopProductsLoading />
      <div className="hidden min-h-[40vh] items-center justify-center lg:flex" aria-busy="true">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-300 border-t-[#f66913]" />
      </div>
    </>
  );
}
