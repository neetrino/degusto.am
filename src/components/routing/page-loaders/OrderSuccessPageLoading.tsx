import { ORDER_SUCCESS_PAGE_BG } from '@/app/orders/[number]/order-success-ui';

type OrderSuccessPageLoadingProps = {
  ariaLabel?: string;
};

/** Order success / confirmation page skeleton. */
export function OrderSuccessPageLoading({
  ariaLabel = 'Loading order',
}: OrderSuccessPageLoadingProps) {
  return (
    <div
      className="mx-auto flex w-full max-w-[560px] flex-col items-center px-4 py-10 sm:py-14"
      style={{ backgroundColor: ORDER_SUCCESS_PAGE_BG }}
      aria-busy="true"
      aria-label={ariaLabel}
    >
      <div className="size-16 animate-pulse rounded-full bg-[#e8e8e8]" />
      <div className="mt-6 h-8 w-4/5 max-w-md animate-pulse rounded bg-[#e8e8e8]" />
      <div className="mt-3 h-4 w-full animate-pulse rounded bg-[#e8e8e8]" />
      <div className="mt-8 h-64 w-full animate-pulse rounded-xl bg-[#e8e8e8]" />
      <div className="mt-6 h-28 w-full animate-pulse rounded-xl bg-[#e8e8e8]" />
      <div className="mt-8 flex w-full gap-3">
        <div className="h-12 flex-1 animate-pulse rounded-xl bg-[#e8e8e8]" />
        <div className="h-12 flex-1 animate-pulse rounded-xl bg-[#e8e8e8]" />
      </div>
    </div>
  );
}
