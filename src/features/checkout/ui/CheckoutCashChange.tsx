"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

import {
  checkoutTileItem,
  checkoutTileStagger,
} from "@/features/checkout/ui/CheckoutMotion";
import { staticAssetUrl } from "@/lib/media/static-asset-url";

export const CASH_CHANGE_OPTIONS = [
  1000, 5000, 10_000, 20_000,
] as const;

export type CashChangePreference =
  | (typeof CASH_CHANGE_OPTIONS)[number]
  | "none"
  | null;

type CheckoutCashChangeProps = {
  title: string;
  hint: string;
  noneLabel: string;
  value: CashChangePreference;
  onChange: (value: CashChangePreference) => void;
  disabled?: boolean;
};

const NOTE_SRC: Record<(typeof CASH_CHANGE_OPTIONS)[number], string> = {
  1000: staticAssetUrl("/assets/checkout/note-1000.webp"),
  5000: staticAssetUrl("/assets/checkout/note-5000.webp"),
  10_000: staticAssetUrl("/assets/checkout/note-10000.webp"),
  20_000: staticAssetUrl("/assets/checkout/note-20000.webp"),
};

/** Shared tile size so all denomination buttons match. */
const NOTE_ASPECT_RATIO = "2 / 1";

/** Cash change helper — pick the bill you will pay with, or no change. */
export function CheckoutCashChange({
  title,
  hint,
  noneLabel,
  value,
  onChange,
  disabled = false,
}: CheckoutCashChangeProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section className="rounded-[32px] border border-[#dedede]/90 bg-white p-6 shadow-[0_12px_40px_rgba(60,47,47,0.04)] sm:p-7">
      <h2 className="font-display text-2xl leading-none font-black tracking-tight text-[#3C2F2F] uppercase">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#717182] sm:text-base">
        {hint}
      </p>

      <motion.div
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
        variants={reduceMotion ? undefined : checkoutTileStagger}
        className="mt-5 grid grid-cols-2 items-stretch gap-3 sm:grid-cols-4 sm:gap-4"
        role="radiogroup"
        aria-label={title}
      >
        {CASH_CHANGE_OPTIONS.map((amount) => {
          const selected = value === amount;
          return (
            <motion.button
              key={amount}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(amount)}
              variants={reduceMotion ? undefined : checkoutTileItem}
              whileHover={reduceMotion ? undefined : { y: -4, scale: 1.03 }}
              whileTap={reduceMotion ? undefined : { scale: 0.97 }}
              className={`relative block w-full overflow-hidden rounded-[18px] border-2 p-0 leading-[0] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff7f20] disabled:opacity-60 ${
                selected
                  ? "border-[#ff7f20] shadow-[0_0_0_3px_rgba(255,127,32,0.2)]"
                  : "border-[#dedede] hover:border-[#ff7f20]/40"
              }`}
              style={{ aspectRatio: NOTE_ASPECT_RATIO }}
            >
              <Image
                src={NOTE_SRC[amount]}
                alt={`${amount} AMD`}
                fill
                sizes="(max-width: 640px) 45vw, 160px"
                className="object-cover object-center"
              />
            </motion.button>
          );
        })}
      </motion.div>

      <motion.button
        type="button"
        disabled={disabled}
        onClick={() => onChange("none")}
        aria-pressed={value === "none"}
        whileHover={reduceMotion ? undefined : { scale: 1.01 }}
        whileTap={reduceMotion ? undefined : { scale: 0.99 }}
        className={`mt-5 inline-flex h-12 w-full items-center justify-center rounded-[18px] border-2 text-base font-semibold transition disabled:opacity-60 ${
          value === "none"
            ? "border-[#ff7f20] bg-[#fff5ed] text-[#3C2F2F]"
            : "border-[#ff7f20] bg-white text-[#3C2F2F] hover:bg-[#fff5ed]"
        }`}
      >
        {noneLabel}
      </motion.button>
    </section>
  );
}
