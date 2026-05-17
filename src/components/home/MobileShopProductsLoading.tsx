/** Inline skeleton while `/shop` product list RSC loads (keeps mobile chrome visible). */
export function MobileShopProductsLoading() {
  return (
    <div className="pb-8 pt-0 lg:hidden" aria-busy="true" aria-label="Loading products">
      <div className="mx-auto w-full max-w-[1470px]">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-[#f3f3f5]" />
        <div className="mt-3 h-4 w-56 animate-pulse rounded bg-[#f3f3f5]" />
        <div className="mt-4 flex gap-2 overflow-hidden">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-9 w-24 shrink-0 animate-pulse rounded-full bg-[#f3f3f5]" />
          ))}
        </div>
        <div className="mt-8 grid grid-cols-2 gap-x-[14px] gap-y-[22px]">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-[240px] w-full animate-pulse rounded-[20px] bg-[#ffeacc]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
