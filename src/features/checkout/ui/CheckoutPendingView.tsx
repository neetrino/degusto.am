"use client";

import { AppLink } from "@/components/ui/AppLink";
import { CheckoutReveal } from "@/features/checkout/ui/CheckoutReveal";

type CheckoutPendingViewProps = {
  locale: string;
  title: string;
  body: string;
  orderNumber: string;
  continueShoppingLabel: string;
};

/** Shown when Idram SUCCESS_URL fires before RESULT confirm. */
export function CheckoutPendingView({
  locale,
  title,
  body,
  orderNumber,
  continueShoppingLabel,
}: CheckoutPendingViewProps) {
  return (
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen overflow-x-clip bg-white">
      <div className="relative mx-auto flex max-w-md items-center justify-center px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <CheckoutReveal variant="scale" durationMs={700} className="w-full">
          <div className="relative rounded-[28px] border border-[#FFE5CF] bg-[linear-gradient(168deg,#fffef9_0%,#fff7eb_48%,#ffeed9_100%)] px-5 pt-6 pb-5 shadow-[0_16px_40px_rgba(50,24,0,0.1)] sm:rounded-[32px] sm:px-7 sm:pt-7 sm:pb-6">
            <h1 className="text-center text-[1.35rem] leading-tight font-bold tracking-tight text-[#16331f] sm:text-[1.6rem]">
              {title}
            </h1>
            <p className="mt-2 text-center text-[13px] leading-snug text-[#395145] sm:text-sm">
              {body}
            </p>
            <p className="mt-3 text-center text-[11px] font-bold tracking-[0.06em] text-[#ff7f20]">
              #{orderNumber}
            </p>
            <AppLink
              href={`/${locale}/products`}
              prefetchPolicy="intent"
              className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-full bg-[#1f3a22] px-4 text-sm font-bold text-[#fffdf8] transition hover:bg-[#19311c]"
            >
              {continueShoppingLabel}
            </AppLink>
          </div>
        </CheckoutReveal>
      </div>
    </div>
  );
}
