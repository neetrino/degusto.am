'use client';

import { ProductInfoColumnSkeleton } from './ProductInfoColumnSkeleton';

/**
 * Initial PDP skeleton before first visual payload (stable min-height to limit CLS).
 */
export function ProductPageShell() {
  return (
    <div
      className="mx-auto max-w-7xl max-lg:px-0 max-lg:py-6 px-4 py-12 min-h-[min(100dvh,720px)] sm:px-6 lg:px-8"
      aria-busy="true"
      aria-label="Product loading"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-12 items-start">
        <div className="flex w-full flex-col gap-4" aria-hidden>
          <div className="relative aspect-[6/5] w-full rounded-2xl bg-neutral-100" />
          <div className="flex justify-center gap-3">
            <div className="aspect-square w-20 shrink-0 rounded-xl bg-neutral-100 sm:w-24" />
            <div className="aspect-square w-20 shrink-0 rounded-xl bg-neutral-100 sm:w-24" />
            <div className="aspect-square w-20 shrink-0 rounded-xl bg-neutral-100 sm:w-24" />
          </div>
        </div>
        <ProductInfoColumnSkeleton />
      </div>
    </div>
  );
}
