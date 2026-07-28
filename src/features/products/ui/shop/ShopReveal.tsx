"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import type { ReactNode } from "react";

type ShopRevealVariant = "up" | "left" | "right" | "scale";

type ShopRevealProps = {
  children: ReactNode;
  className?: string;
  variant?: ShopRevealVariant;
  delayMs?: number;
  durationMs?: number;
  once?: boolean;
  amount?: number;
};

const EASE = [0.22, 1, 0.36, 1] as const;

function buildVariants(
  variant: ShopRevealVariant,
  durationMs: number,
): Variants {
  const duration = durationMs / 1000;
  const hidden =
    variant === "left"
      ? { opacity: 0, x: -36, filter: "blur(10px)" }
      : variant === "right"
        ? { opacity: 0, x: 36, filter: "blur(10px)" }
        : variant === "scale"
          ? { opacity: 0, scale: 0.9, filter: "blur(8px)" }
          : { opacity: 0, y: 32, filter: "blur(10px)" };

  return {
    hidden,
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: { duration, ease: EASE },
    },
  };
}

/** Motion scroll/render reveal for shop sections. */
export function ShopReveal({
  children,
  className = "",
  variant = "up",
  delayMs = 0,
  durationMs = 750,
  once = true,
  amount = 0.2,
}: ShopRevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount, margin: "0px 0px -8% 0px" }}
      variants={buildVariants(variant, durationMs)}
      transition={{ delay: delayMs / 1000 }}
    >
      {children}
    </motion.div>
  );
}
