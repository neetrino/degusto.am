"use client";

import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";

export const SHOP_EASE = [0.22, 1, 0.36, 1] as const;

export const shopGridVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.04 },
  },
};

const cardEnterVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: SHOP_EASE },
  },
};

type ShopProductCardShellProps = {
  children: ReactNode;
  index: number;
  reduceMotion: boolean | null;
};

/** Simple entrance only — no scroll float / filter (those hid cards after search). */
export function ShopProductCardShell({
  children,
  index,
  reduceMotion,
}: ShopProductCardShellProps) {
  return (
    <motion.div
      variants={reduceMotion ? undefined : cardEnterVariants}
      className="relative"
      custom={index}
    >
      {children}
    </motion.div>
  );
}
