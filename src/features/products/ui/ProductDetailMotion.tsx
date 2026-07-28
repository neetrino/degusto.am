import type { Variants } from "motion/react";

export const PRODUCT_EASE = [0.22, 1, 0.36, 1] as const;

export const productInfoStagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.18 },
  },
};

export const productInfoItem: Variants = {
  hidden: {
    opacity: 0,
    y: 28,
    filter: "blur(10px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.75, ease: PRODUCT_EASE },
  },
};

export const productThumbStagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.35 },
  },
};

export const productThumbItem: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.88 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 160, damping: 18 },
  },
};

export const productCardStagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.12 },
  },
};

export const productCardItem: Variants = {
  hidden: {
    opacity: 0,
    y: 36,
    scale: 0.94,
    filter: "blur(8px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 110, damping: 16 },
  },
};
