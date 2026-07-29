"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import type { ReactNode } from "react";

import { CHECKOUT_EASE } from "@/features/checkout/ui/CheckoutMotion";

type CheckoutRevealVariant = "up" | "left" | "right" | "scale";

type CheckoutRevealProps = {
  children: ReactNode;
  className?: string;
  variant?: CheckoutRevealVariant;
  delayMs?: number;
  durationMs?: number;
};

function buildVariants(
  variant: CheckoutRevealVariant,
  durationMs: number,
): Variants {
  const duration = durationMs / 1000;
  const hidden =
    variant === "left"
      ? { opacity: 0, x: -36, filter: "blur(12px)" }
      : variant === "right"
        ? { opacity: 0, x: 36, filter: "blur(12px)" }
        : variant === "scale"
          ? { opacity: 0, scale: 0.94, filter: "blur(10px)" }
          : { opacity: 0, y: 32, filter: "blur(12px)" };

  return {
    hidden,
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: { duration, ease: CHECKOUT_EASE },
    },
  };
}

/**
 * Mount entrance for checkout blocks.
 * Uses `animate` (not whileInView) to avoid opacity-stuck bugs on remount.
 */
export function CheckoutReveal({
  children,
  className = "",
  variant = "up",
  delayMs = 0,
  durationMs = 800,
}: CheckoutRevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={buildVariants(variant, durationMs)}
      transition={{ delay: delayMs / 1000 }}
    >
      {children}
    </motion.div>
  );
}
