import { STOREFRONT_PAGE_CONTAINER_CLASS } from '@/constants/storefront-desktop-layout';

export function ProfilePageSkeleton() {
  return (
    <div className="min-h-full bg-white" aria-busy="true" aria-label="Loading profile">
      <div className={`${STOREFRONT_PAGE_CONTAINER_CLASS} hidden py-10 lg:block`}>
        <div className="grid grid-cols-12 items-start gap-6 lg:gap-8">
          <aside className="col-span-12 lg:col-span-4 xl:col-span-3">
            <div className="h-[560px] animate-pulse rounded-2xl border border-[#F66812]/20 bg-white" />
          </aside>
          <main className="col-span-12 lg:col-span-8 xl:col-span-9">
            <div className="h-[560px] animate-pulse rounded-2xl border border-[#F66812]/20 bg-white" />
          </main>
        </div>
      </div>
      <div className="mx-auto w-full max-w-md max-lg:px-0 px-4 pb-8 pt-6 lg:hidden">
        <div className="h-[420px] animate-pulse rounded-[2rem] bg-white ring-1 ring-[#F66812]/20" />
      </div>
    </div>
  );
}
