import type { Variants } from "motion/react";

export const CHECKOUT_EASE = [0.22, 1, 0.36, 1] as const;

export const checkoutPageStagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.08 },
  },
};

export const checkoutBlock: Variants = {
  hidden: {
    opacity: 0,
    y: 36,
    filter: "blur(12px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: CHECKOUT_EASE },
  },
};

export const checkoutSectionStagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.09, delayChildren: 0.06 },
  },
};

export const checkoutSectionItem: Variants = {
  hidden: {
    opacity: 0,
    y: 28,
    scale: 0.98,
    filter: "blur(10px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: CHECKOUT_EASE },
  },
};

export const checkoutTileStagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.12 },
  },
};

export const checkoutTileItem: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 160, damping: 18 },
  },
};
