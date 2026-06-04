/** Desktop shop product grid skeleton while category products load. */
export function ShopDesktopProductsSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-x-[30px] gap-y-[34px]" aria-busy="true" aria-hidden>
      {Array.from({ length: 8 }, (_, index) => (
        <div
          key={index}
          className="h-[284px] animate-pulse rounded-[20px] border-[1.5px] border-[#ededed] bg-[#f7f7f8]"
        />
      ))}
    </div>
  );
}
