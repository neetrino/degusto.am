"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
} from "motion/react";
import { useEffect, useRef, useState } from "react";

import { formatGroupedInteger } from "@/lib/money/format";

type ProductAnimatedPriceProps = {
  amount: number;
  /** Suffix after the number, e.g. " Դ". */
  suffix: string;
  className?: string;
};

type PriceDelta = {
  id: number;
  signedAmount: number;
};

const DELTA_VISIBLE_MS = 900;

function formatSignedDelta(value: number): string {
  const rounded = Math.round(value);
  const grouped = formatGroupedInteger(Math.abs(rounded));
  return `${rounded > 0 ? "+" : "−"}${grouped}`;
}

/** Spring-animated PDP unit price with +/- delta flash on change. */
export function ProductAnimatedPrice({
  amount,
  suffix,
  className = "",
}: ProductAnimatedPriceProps) {
  const reduceMotion = useReducedMotion();
  const isFirstAmount = useRef(true);
  const previousAmount = useRef(amount);
  const deltaId = useRef(0);
  const motionValue = useMotionValue(amount);
  const spring = useSpring(motionValue, {
    stiffness: 180,
    damping: 24,
    mass: 0.65,
  });
  const [display, setDisplay] = useState(
    () => `${formatGroupedInteger(amount)}${suffix}`,
  );
  const [delta, setDelta] = useState<PriceDelta | null>(null);
  const [pulseDirection, setPulseDirection] = useState<"up" | "down" | null>(
    null,
  );

  useMotionValueEvent(spring, "change", (latest) => {
    if (reduceMotion) return;
    setDisplay(`${formatGroupedInteger(latest)}${suffix}`);
  });

  useEffect(() => {
    if (reduceMotion) {
      previousAmount.current = amount;
      return;
    }

    if (isFirstAmount.current) {
      isFirstAmount.current = false;
      motionValue.jump(amount);
      previousAmount.current = amount;
      return;
    }

    const signedDelta = amount - previousAmount.current;
    previousAmount.current = amount;
    motionValue.set(amount);

    if (signedDelta === 0) return;

    deltaId.current += 1;
    const id = deltaId.current;

    const showTimer = window.setTimeout(() => {
      setDelta({ id, signedAmount: signedDelta });
      setPulseDirection(signedDelta > 0 ? "up" : "down");
    }, 0);
    const clearDelta = window.setTimeout(() => {
      setDelta((current) => (current?.id === id ? null : current));
    }, DELTA_VISIBLE_MS);
    const clearPulse = window.setTimeout(() => {
      setPulseDirection(null);
    }, 320);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(clearDelta);
      window.clearTimeout(clearPulse);
    };
  }, [amount, motionValue, reduceMotion]);

  const pulseColor =
    pulseDirection === "up"
      ? "#16a34a"
      : pulseDirection === "down"
        ? "#dc2626"
        : "#3C2F2F";

  return (
    <span className="relative inline-flex items-baseline">
      <motion.p
        className={className}
        aria-live="polite"
        animate={
          reduceMotion
            ? undefined
            : {
                scale: pulseDirection ? [1, 1.05, 1] : 1,
                color: pulseColor,
              }
        }
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      >
        {reduceMotion ? `${formatGroupedInteger(amount)}${suffix}` : display}
      </motion.p>

      <AnimatePresence>
        {delta && !reduceMotion ? (
          <motion.span
            key={delta.id}
            aria-hidden
            className={`pointer-events-none absolute left-full top-0 ml-2 whitespace-nowrap text-base font-semibold tabular-nums ${
              delta.signedAmount > 0 ? "text-emerald-600" : "text-red-600"
            }`}
            initial={{ opacity: 0, y: 10, scale: 0.85 }}
            animate={{ opacity: 1, y: -6, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.9 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {formatSignedDelta(delta.signedAmount)}
            {suffix}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </span>
  );
}
