'use client';

import { BodyBackground } from '@/components/BodyBackground';
import {
  CHECKOUT_PAGE_GRID_CLASS,
  CHECKOUT_PAGE_SHELL_CLASS,
  CHECKOUT_SUMMARY_COLUMN_CLASS,
} from '@/app/checkout/checkout-ui';

type CheckoutPageLoadingProps = {
  ariaLabel?: string;
};

/** Checkout family — brand orange pulse blocks on white. */
export function CheckoutPageLoading({ ariaLabel = 'Loading checkout' }: CheckoutPageLoadingProps) {
  return (
    <>
      <BodyBackground color="#ffffff" />
      <div className={CHECKOUT_PAGE_SHELL_CLASS} aria-busy="true" aria-label={ariaLabel}>
        <div className="animate-pulse">
          <div className="mb-8 h-9 w-48 rounded-lg bg-[#F66812]/15 md:mb-10" />
          <div className={CHECKOUT_PAGE_GRID_CLASS}>
            <div className="space-y-4 md:col-span-3 lg:col-span-2">
              <div className="h-40 rounded-2xl bg-[#F66812]/10" />
              <div className="h-36 rounded-2xl bg-[#F66812]/10" />
              <div className="h-52 rounded-2xl bg-[#F66812]/10" />
            </div>
            <div className={`h-72 rounded-t-2xl bg-[#F66812]/10 ${CHECKOUT_SUMMARY_COLUMN_CLASS}`} />
          </div>
        </div>
      </div>
    </>
  );
}
