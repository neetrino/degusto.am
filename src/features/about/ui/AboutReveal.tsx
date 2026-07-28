"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import type { ReactNode } from "react";

type AboutRevealVariant = "up" | "left" | "right" | "scale";

type AboutRevealProps = {
  children: ReactNode;
  className?: string;
  variant?: AboutRevealVariant;
  delayMs?: number;
  durationMs?: number;
  once?: boolean;
};

const EASE = [0.22, 1, 0.36, 1] as const;

function buildVariants(
  variant: AboutRevealVariant,
  durationMs: number,
): Variants {
  const duration = durationMs / 1000;
  const hidden =
    variant === "left"
      ? { opacity: 0, x: -36, filter: "blur(8px)" }
      : variant === "right"
        ? { opacity: 0, x: 36, filter: "blur(8px)" }
        : variant === "scale"
          ? { opacity: 0, scale: 0.92, filter: "blur(6px)" }
          : { opacity: 0, y: 28, filter: "blur(8px)" };

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

/** Motion-powered scroll reveal for About sections. */
export function AboutReveal({
  children,
  className = "",
  variant = "up",
  delayMs = 0,
  durationMs = 750,
  once = true,
}: AboutRevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.2, margin: "0px 0px -8% 0px" }}
      variants={buildVariants(variant, durationMs)}
      transition={{ delay: delayMs / 1000 }}
    >
      {children}
    </motion.div>
  );
}
