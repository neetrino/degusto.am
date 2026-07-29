"use client";

import { Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useId } from "react";

export type ProductModifierOption = {
  id: string;
  label: string;
  /** Optional surcharge label, e.g. "+550 Դ". */
  priceLabel?: string;
  /** AMD major-unit surcharge included in the live PDP total. */
  priceAmount?: number;
};

type ProductModifierOptionRowProps = {
  option: ProductModifierOption;
  checked: boolean;
  index: number;
  onToggle: () => void;
};

/** Modifier option row — stays inside parent bounds, borders never collide. */
export function ProductModifierOptionRow({
  option,
  checked,
  index,
  onToggle,
}: ProductModifierOptionRowProps) {
  const reduceMotion = useReducedMotion();
  const inputId = useId();

  return (
    <motion.li
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30,
        delay: index * 0.04,
      }}
      className="min-w-0"
    >
      <motion.label
        htmlFor={inputId}
        whileTap={reduceMotion ? undefined : { scale: 0.985 }}
        className={`flex min-w-0 cursor-pointer items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-sm transition-colors ${
          checked
            ? "border-[#ff7f20] bg-[#fff7f0] hover:bg-[#fff1e4]"
            : "border-[#e6e6e6] bg-white hover:bg-[#fafafa]"
        }`}
      >
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="sr-only"
        />

        <ModifierCheckbox checked={checked} />

        <span className="min-w-0 flex-1 truncate font-medium tracking-tight text-[#3c2f2f]">
          {option.label}
        </span>

        {option.priceLabel ? (
          <PriceBadge label={option.priceLabel} checked={checked} />
        ) : null}
      </motion.label>
    </motion.li>
  );
}

function ModifierCheckbox({ checked }: { checked: boolean }) {
  return (
    <motion.span
      aria-hidden
      className="flex size-6 shrink-0 items-center justify-center rounded-full border-[1.5px]"
      animate={{
        backgroundColor: checked ? "#ff7f20" : "#ffffff",
        borderColor: checked ? "#ff7f20" : "#d8d8d8",
      }}
      transition={{ type: "spring", stiffness: 480, damping: 28 }}
    >
      <motion.span
        initial={false}
        animate={
          checked
            ? { opacity: 1, scale: 1, rotate: 0 }
            : { opacity: 0, scale: 0.35, rotate: -25 }
        }
        transition={{ type: "spring", stiffness: 520, damping: 24 }}
      >
        <Check className="size-3.5 text-white" strokeWidth={3} />
      </motion.span>
    </motion.span>
  );
}

function PriceBadge({
  label,
  checked,
}: {
  label: string;
  checked: boolean;
}) {
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${
        checked
          ? "bg-[#ff7f20]/15 text-[#c45a0a]"
          : "bg-emerald-50 text-emerald-700"
      }`}
    >
      {label}
    </span>
  );
}
