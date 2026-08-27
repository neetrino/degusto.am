"use client";

import { Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { AppLink } from "@/components/ui/AppLink";
import {
  CHECKOUT_EASE,
  checkoutPageStagger,
  checkoutSectionItem,
} from "@/features/checkout/ui/CheckoutMotion";
import { CheckoutReveal } from "@/features/checkout/ui/CheckoutReveal";

type CheckoutSuccessViewProps = {
  locale: string;
  title: string;
  body: string;
  totalLabel: string;
  continueShoppingLabel: string;
  viewOrdersLabel: string;
  orderNumber: string;
  showOrdersLink: boolean;
};

/**
 * Degusto checkout confirmation — compact cream card with brand accents.
 */
export function CheckoutSuccessView({
  locale,
  title,
  body,
  totalLabel,
  continueShoppingLabel,
  viewOrdersLabel,
  orderNumber,
  showOrdersLink,
}: CheckoutSuccessViewProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      data-checkout-success-page
      className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen overflow-x-clip bg-white"
    >
      <div className="relative mx-auto flex max-w-md items-center justify-center px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <CheckoutReveal variant="scale" durationMs={700} className="w-full">
          <motion.div
            className="relative rounded-[28px] border border-[#FFE5CF] bg-[linear-gradient(168deg,#fffef9_0%,#fff7eb_48%,#ffeed9_100%)] px-5 pt-6 pb-5 shadow-[0_16px_40px_rgba(50,24,0,0.1)] sm:rounded-[32px] sm:px-7 sm:pt-7 sm:pb-6"
            variants={reduceMotion ? undefined : checkoutPageStagger}
            initial={reduceMotion ? undefined : "hidden"}
            animate={reduceMotion ? undefined : "visible"}
          >
            <div
              className="pointer-events-none absolute -top-10 -right-8 h-28 w-28 rounded-full bg-[#ff7f20]/16 blur-2xl"
              aria-hidden
            />

            <motion.div
              variants={reduceMotion ? undefined : checkoutSectionItem}
              className="relative flex flex-col items-center text-center"
            >
              <motion.div
                className="mb-3 rounded-full bg-[#f4dfbf] p-1 shadow-[0_8px_18px_rgba(49,27,0,0.14)]"
                initial={
                  reduceMotion
                    ? undefined
                    : { scale: 0.7, opacity: 0 }
                }
                animate={
                  reduceMotion ? undefined : { scale: 1, opacity: 1 }
                }
                transition={{
                  duration: 0.55,
                  ease: CHECKOUT_EASE,
                  delay: 0.08,
                }}
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-[#1f3a22] text-[#fff2d8] sm:size-14">
                  <Check
                    className="size-6 sm:size-7"
                    strokeWidth={2.75}
                    aria-hidden
                  />
                </span>
              </motion.div>

              <h1 className="text-[1.35rem] leading-tight font-bold tracking-tight text-[#16331f] sm:text-[1.6rem]">
                {title}
              </h1>

              <p className="mt-2 max-w-sm text-[13px] leading-snug text-[#395145] sm:text-sm">
                {body}
              </p>

              <p className="mt-3 inline-flex items-center rounded-full border border-[#ff7f20]/30 bg-white px-3 py-1 text-[11px] font-bold tracking-[0.06em] text-[#ff7f20]">
                #{orderNumber}
              </p>

              <div className="mt-4 w-full rounded-2xl border border-[#ff7f20]/15 bg-white/80 px-4 py-3">
                <p className="text-base font-bold tracking-tight text-[#16331f] sm:text-lg">
                  {totalLabel}
                </p>
              </div>

              <div
                className={`mt-5 grid w-full gap-2.5 ${
                  showOrdersLink ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
                }`}
              >
                <AppLink
                  href={`/${locale}/products`}
                  prefetchPolicy="intent"
                  className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[#1f3a22] px-4 text-sm font-bold text-[#fffdf8] transition hover:bg-[#19311c]"
                >
                  {continueShoppingLabel}
                </AppLink>
                {showOrdersLink ? (
                  <AppLink
                    href={`/${locale}/profile/orders`}
                    prefetchPolicy="intent"
                    className="inline-flex h-11 w-full items-center justify-center rounded-full border border-[#1f3a22]/25 bg-white px-4 text-sm font-bold text-[#1f3a22] transition hover:border-[#ff7f20]/50 hover:bg-[#fff5ed]"
                  >
                    {viewOrdersLabel}
                  </AppLink>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        </CheckoutReveal>
      </div>
    </div>
  );
}
