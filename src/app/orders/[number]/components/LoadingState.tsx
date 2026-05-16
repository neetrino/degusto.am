'use client';

import { BodyBackground } from '../../../../components/BodyBackground';
import { ORDER_SUCCESS_PAGE_BG } from '../order-success-ui';

export function LoadingState() {
  return (
    <>
      <BodyBackground color={ORDER_SUCCESS_PAGE_BG} />
      <div className="mx-auto flex w-full max-w-[560px] flex-col items-center px-4 py-10 sm:py-14">
        <div className="size-16 animate-pulse rounded-full bg-gray-200" />
        <div className="mt-6 h-8 w-4/5 max-w-md animate-pulse rounded bg-gray-200" />
        <div className="mt-3 h-4 w-full animate-pulse rounded bg-gray-200" />
        <div className="mt-8 h-64 w-full animate-pulse rounded-xl bg-gray-200" />
        <div className="mt-6 h-28 w-full animate-pulse rounded-xl bg-gray-200" />
        <div className="mt-8 flex w-full gap-3">
          <div className="h-12 flex-1 animate-pulse rounded-xl bg-gray-200" />
          <div className="h-12 flex-1 animate-pulse rounded-xl bg-gray-200" />
        </div>
      </div>
    </>
  );
}
