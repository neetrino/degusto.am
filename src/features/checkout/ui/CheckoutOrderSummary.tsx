"use client";

import { motion, useReducedMotion } from "motion/react";

import { CHECKOUT_EASE } from "@/features/checkout/ui/CheckoutMotion";

type CheckoutOrderSummaryProps = {
  title: string;
  couponTitle: string;
  couponPlaceholder: string;
  couponApplyLabel: string;
  couponApplyingLabel: string;
  discountLabel: string;
  subtotalLabel: string;
  shippingLabel: string;
  taxLabel: string;
  totalLabel: string;
  subtotalFormatted: string;
  shippingFormatted: string;
  taxFormatted: string;
  discountFormatted: string | null;
  totalFormatted: string;
  couponDraft: string;
  onCouponDraftChange: (value: string) => void;
  onApplyCoupon: () => void;
  couponError: string | null;
  isApplyingCoupon: boolean;
  error: string | null;
  isSubmitting: boolean;
  canPlaceOrder: boolean;
  placeOrderLabel: string;
  processingLabel: string;
};

/** Sticky order summary — plain sticky wrapper (no ancestor transform/filter). */
export function CheckoutOrderSummary({
  title,
  couponTitle,
  couponPlaceholder,
  couponApplyLabel,
  couponApplyingLabel,
  discountLabel,
  subtotalLabel,
  shippingLabel,
  taxLabel,
  totalLabel,
  subtotalFormatted,
  shippingFormatted,
  taxFormatted,
  discountFormatted,
  totalFormatted,
  couponDraft,
  onCouponDraftChange,
  onApplyCoupon,
  couponError,
  isApplyingCoupon,
  error,
  isSubmitting,
  canPlaceOrder,
  placeOrderLabel,
  processingLabel,
}: CheckoutOrderSummaryProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="lg:sticky lg:top-36 lg:self-start">
      <aside className="relative overflow-hidden rounded-[32px] bg-surface-dark p-6 text-white shadow-[0_22px_60px_rgba(0,0,0,0.28)] sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-[#ff7f20]/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-12 h-44 w-44 rounded-full bg-[#3E573D]/35 blur-3xl"
        />

        <div className="relative">
          <h2 className="font-display text-2xl leading-none font-black tracking-tight text-white uppercase">
            <span className="text-brand-headline">{title}</span>
          </h2>

          <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <p className="mb-3 text-sm text-white/75">{couponTitle}</p>
            <div className="flex gap-2">
              <input
                type="text"
                name="couponCodeDraft"
                value={couponDraft}
                onChange={(event) => onCouponDraftChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    onApplyCoupon();
                  }
                }}
                placeholder={couponPlaceholder}
                autoComplete="off"
                disabled={isSubmitting || isApplyingCoupon}
                className="h-11 min-w-0 flex-1 rounded-full border border-white/15 bg-white/10 px-4 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-[#ff7f20] focus:ring-2 focus:ring-[#ff7f20]/25 disabled:opacity-60"
              />
              <button
                type="button"
                className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-[#ff7f20] px-4 text-sm font-bold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={
                  isSubmitting || isApplyingCoupon || !couponDraft.trim()
                }
                onClick={onApplyCoupon}
              >
                {isApplyingCoupon ? couponApplyingLabel : couponApplyLabel}
              </button>
            </div>
            {couponError ? (
              <p className="mt-2 text-sm text-[#ffb4a8]" role="alert">
                {couponError}
              </p>
            ) : null}
          </div>

          <div className="mt-6 space-y-3.5 text-sm">
            <div className="flex justify-between gap-4 text-white/70">
              <span>{subtotalLabel}</span>
              <span className="tabular-nums text-white">
                {subtotalFormatted}
              </span>
            </div>
            {discountFormatted ? (
              <div className="flex justify-between gap-4 text-white/70">
                <span>{discountLabel}</span>
                <span className="tabular-nums text-[#7ddea3]">
                  -{discountFormatted}
                </span>
              </div>
            ) : null}
            <div className="flex justify-between gap-4 text-white/70">
              <span>{shippingLabel}</span>
              <span className="max-w-[60%] text-right tabular-nums text-white">
                {shippingFormatted}
              </span>
            </div>
            <div className="flex justify-between gap-4 text-white/70">
              <span>{taxLabel}</span>
              <span className="tabular-nums text-white">{taxFormatted}</span>
            </div>
            <div className="border-t border-white/10 pt-4">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-base font-semibold text-white">
                  {totalLabel}
                </span>
                <motion.span
                  key={totalFormatted}
                  initial={
                    reduceMotion ? false : { opacity: 0.4, y: 6, scale: 0.96 }
                  }
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.35, ease: CHECKOUT_EASE }}
                  className="font-display text-2xl font-black tracking-tight text-brand-headline tabular-nums"
                >
                  {totalFormatted}
                </motion.span>
              </div>
            </div>
          </div>

          {error ? (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-3"
            >
              <p className="text-sm text-[#ffb4a8]">{error}</p>
            </motion.div>
          ) : null}

          <motion.button
            type="submit"
            whileHover={reduceMotion ? undefined : { scale: 1.02 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#ff7f20] px-6 text-base font-bold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSubmitting || !canPlaceOrder}
          >
            {isSubmitting ? processingLabel : placeOrderLabel}
          </motion.button>
        </div>
      </aside>
    </div>
  );
}
