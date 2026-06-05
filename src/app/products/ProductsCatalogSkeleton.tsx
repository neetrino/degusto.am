import {
  STOREFRONT_DESKTOP_MAIN_COLUMN_CLASS,
  STOREFRONT_DESKTOP_SIDEBAR_GAP_CLASS,
  STOREFRONT_PAGE_CONTAINER_CLASS,
} from '@/constants/storefront-desktop-layout';

const GRID =
  'grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4';

/**
 * Shell for /products while catalog data streams in (layout-stable, no spinners).
 */
export function ProductsCatalogSkeleton() {
  return (
    <div className="w-full max-w-full animate-pulse" aria-busy="true" aria-label="Loading products">
      <div className={`${STOREFRONT_PAGE_CONTAINER_CLASS} flex min-w-0 flex-col lg:flex-row ${STOREFRONT_DESKTOP_SIDEBAR_GAP_CLASS}`}>
        <aside className="hidden w-64 shrink-0 self-start rounded-xl bg-gray-50 lg:sticky lg:top-24 lg:z-10 lg:block">
          <div className="p-4 space-y-4">
            <div className="h-24 rounded-lg bg-neutral-200" />
            <div className="h-32 rounded-lg bg-neutral-200" />
            <div className="h-28 rounded-lg bg-neutral-200" />
          </div>
        </aside>
        <div className={`${STOREFRONT_DESKTOP_MAIN_COLUMN_CLASS} w-full py-4`}>
          <div className={GRID}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
                <div className="aspect-square bg-neutral-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-neutral-200 rounded w-4/5" />
                  <div className="h-3 bg-neutral-200 rounded w-1/2" />
                  <div className="h-5 bg-neutral-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
