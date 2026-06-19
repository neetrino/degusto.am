import type { ReactNode } from 'react';
import { ShopDesktopProductsSkeleton } from '../ShopDesktopProductsSkeleton';

function ShopMenuProductsPendingIndicator({ label }: { label: string }) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center pt-4"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="inline-flex items-center gap-2 rounded-full border border-[#ededed] bg-white/95 px-4 py-2 text-sm font-medium text-[#717182] shadow-sm">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#ff7f20] border-t-transparent" />
        {label}
      </span>
    </div>
  );
}

type ShopMenuProductGridShellProps = {
  isPending: boolean;
  loadingLabel: string;
  gridClassName: string;
  hasProducts: boolean;
  emptyState: ReactNode;
  children: ReactNode;
  skeletonVariant: 'desktop' | 'mobile';
};

export function ShopMenuProductGridShell({
  isPending,
  loadingLabel,
  gridClassName,
  hasProducts,
  emptyState,
  children,
  skeletonVariant,
}: ShopMenuProductGridShellProps) {
  if (!hasProducts && isPending) {
    if (skeletonVariant === 'mobile') {
      return (
        <div className={`${gridClassName} mt-8`} aria-busy="true" aria-hidden>
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-[240px] animate-pulse rounded-[20px] bg-[#f3f3f5]" />
          ))}
        </div>
      );
    }
    return <ShopDesktopProductsSkeleton />;
  }

  if (!hasProducts) {
    return emptyState;
  }

  return (
    <div className="relative">
      {isPending ? <ShopMenuProductsPendingIndicator label={loadingLabel} /> : null}
      <div
        className={`${gridClassName} transition-opacity duration-150 ${
          isPending ? 'pointer-events-none opacity-60' : ''
        }`}
      >
        {children}
      </div>
    </div>
  );
}
