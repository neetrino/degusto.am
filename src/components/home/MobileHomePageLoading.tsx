const MOBILE_HOME_CATEGORY_SKELETON_COUNT = 5;
const MOBILE_HOME_PRODUCT_SKELETON_COUNT = 4;
const MOBILE_HOME_PRODUCT_SECTION_COUNT = 2;

function MobileHomeCategorySkeletons() {
  return (
    <div className="grid grid-cols-5 gap-2 pb-1">
      {Array.from({ length: MOBILE_HOME_CATEGORY_SKELETON_COUNT }, (_, index) => (
        <div key={index} className="flex flex-col items-center">
          <div className="h-[72px] w-[48px] animate-pulse rounded-[24px] bg-[#f3f3f5]" />
          <div className="mt-[6px] h-4 w-10 animate-pulse rounded bg-[#f3f3f5]" />
        </div>
      ))}
    </div>
  );
}

function MobileHomeProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-[14px] gap-y-[22px]">
      {Array.from({ length: MOBILE_HOME_PRODUCT_SKELETON_COUNT }, (_, index) => (
        <div
          key={index}
          className="h-[240px] w-full animate-pulse rounded-[20px] bg-[#ffeacc]"
        />
      ))}
    </div>
  );
}

function MobileHomeProductSectionSkeleton() {
  return (
    <div className="mt-[30px] space-y-[22px] px-3">
      <div className="flex items-center justify-between">
        <div className="h-5 w-28 animate-pulse rounded bg-[#f3f3f5]" />
        <div className="h-4 w-16 animate-pulse rounded bg-[#f3f3f5]" />
      </div>
      <MobileHomeProductGridSkeleton />
    </div>
  );
}

/** Inline skeleton while `/` home RSC loads (mobile layout mirrors FigmaHomePageMobile). */
export function MobileHomePageLoading() {
  return (
    <div
      className="relative min-h-screen w-full overflow-x-clip bg-[var(--project-color)] lg:hidden"
      aria-busy="true"
      aria-label="Loading home page"
    >
      <header className="relative px-4 pt-[58px]">
        <div className="flex translate-y-[20px] items-start justify-between">
          <div className="h-[46px] w-[129px] animate-pulse rounded-lg bg-white/30" />
          <div className="flex gap-1">
            <div className="h-12 w-12 animate-pulse rounded-full bg-white/30" />
            <div className="h-12 w-12 animate-pulse rounded-full bg-white/30" />
          </div>
        </div>
        <div className="relative mt-[8px] h-12 translate-y-[20px] animate-pulse rounded-[30px] bg-white/90" />
      </header>

      <div className="relative z-10 mt-[87px] rounded-t-[30px] bg-white pb-[110px] pt-8">
        <div className="space-y-3 px-3">
          <div className="flex items-center justify-between">
            <div className="h-5 w-24 animate-pulse rounded bg-[#f3f3f5]" />
            <div className="h-4 w-16 animate-pulse rounded bg-[#f3f3f5]" />
          </div>
          <MobileHomeCategorySkeletons />
          <div className="flex items-center justify-center gap-1 pt-1">
            {Array.from({ length: 5 }, (_, index) => (
              <span
                key={index}
                className="h-1 w-5 animate-pulse rounded-[12px] bg-[#ffeacc]"
              />
            ))}
          </div>
        </div>

        <div className="mt-[22px] px-3">
          <div className="h-32 w-full animate-pulse rounded-[20px] bg-[#ffeacc]" />
        </div>

        <div className="mt-[19px] flex items-center justify-center gap-1">
          {Array.from({ length: 3 }, (_, index) => (
            <span
              key={index}
              className="h-1 w-5 animate-pulse rounded-[12px] bg-[#ffeacc]"
            />
          ))}
        </div>

        {Array.from({ length: MOBILE_HOME_PRODUCT_SECTION_COUNT }, (_, index) => (
          <MobileHomeProductSectionSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
