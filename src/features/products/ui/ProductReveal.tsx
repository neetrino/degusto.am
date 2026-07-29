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
      ? { opacity: 0, x: -28 }
      : variant === "right"
        ? { opacity: 0, x: 28 }
        : variant === "scale"
          ? { opacity: 0, scale: 0.96 }
          : { opacity: 0, y: 28 };

  return {
    hidden,
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: { duration, ease: PRODUCT_EASE },
    },
  };
}

/** Motion reveal for PDP sections — no lingering filter/transform traps. */
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
