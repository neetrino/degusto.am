'use client';

/** Right-column placeholder while PDP details payload is loading (matches grid slot, limits CLS). */
export function ProductInfoColumnSkeleton() {
  return (
    <div className="flex flex-col h-full space-y-4 pt-2 animate-pulse" aria-busy="true" aria-label="Product details loading">
      <div className="h-4 w-24 bg-neutral-200 rounded" aria-hidden />
      <div className="h-10 w-4/5 max-w-md bg-neutral-200 rounded" aria-hidden />
      <div className="h-6 w-32 bg-neutral-200 rounded" aria-hidden />
      <div className="h-12 w-44 bg-neutral-200 rounded" aria-hidden />
      <div className="h-24 w-full bg-neutral-200 rounded-lg" aria-hidden />
      <div className="h-40 w-full bg-neutral-200 rounded-lg" aria-hidden />
      <div className="mt-auto pt-6 space-y-3">
        <div className="h-12 w-full bg-neutral-200 rounded-xl" aria-hidden />
      </div>
    </div>
  );
}
