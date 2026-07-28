"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import type { ReactNode } from "react";

import { PRODUCT_EASE } from "@/features/products/ui/ProductDetailMotion";

type ProductRevealVariant = "up" | "left" | "right" | "scale";

type ProductRevealProps = {
  children: ReactNode;
  className?: string;
  variant?: ProductRevealVariant;
  delayMs?: number;
  durationMs?: number;
  once?: boolean;
  amount?: number;
};

function buildVariants(
  variant: ProductRevealVariant,
  durationMs: number,
): Variants {
  const duration = durationMs / 1000;
  const hidden =
    variant === "left"
      ? { opacity: 0, x: -40, filter: "blur(12px)" }
      : variant === "right"
        ? { opacity: 0, x: 40, filter: "blur(12px)" }
        : variant === "scale"
          ? { opacity: 0, scale: 0.92, filter: "blur(10px)" }
          : { opacity: 0, y: 40, filter: "blur(12px)" };

  return {
    hidden,
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: { duration, ease: PRODUCT_EASE },
    },
  };
}

/** Motion scroll/render reveal for PDP sections. */
export function ProductReveal({
  children,
  className = "",
  variant = "up",
  delayMs = 0,
  durationMs = 850,
  once = true,
  amount = 0.18,
}: ProductRevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount, margin: "0px 0px -6% 0px" }}
      variants={buildVariants(variant, durationMs)}
      transition={{ delay: delayMs / 1000 }}
    >
      {children}
    </motion.div>
  );
}
