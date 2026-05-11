'use client';

import { ProductInfoColumnSkeleton } from './ProductInfoColumnSkeleton';

/**
 * Initial PDP skeleton before first visual payload (stable min-height to limit CLS).
 */
export function ProductPageShell() {
  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-[min(100dvh,720px)]"
      aria-busy="true"
      aria-label="Product loading"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-12 items-start">
        <div className="flex gap-6 items-start">
          <div className="flex flex-col gap-4 w-28 flex-shrink-0" aria-hidden>
            <div className="aspect-[3/4] w-full rounded-lg bg-neutral-100" />
            <div className="aspect-[3/4] w-full rounded-lg bg-neutral-100" />
            <div className="aspect-[3/4] w-full rounded-lg bg-neutral-100" />
          </div>
          <div className="flex-1">
            <div className="relative aspect-square w-full max-w-[560px] mx-auto lg:mx-0 rounded-lg bg-neutral-100" aria-hidden />
          </div>
        </div>
        <ProductInfoColumnSkeleton />
      </div>
    </div>
  );
}
