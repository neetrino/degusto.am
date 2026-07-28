"use client";

import {
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
  type Variants,
} from "motion/react";
import { useState } from "react";

export const HEADER_EASE = [0.22, 1, 0.36, 1] as const;

/** Shell drops in once; children stagger after. */
export const headerShellVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -56,
    filter: "blur(14px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 1.05,
      ease: HEADER_EASE,
      when: "beforeChildren",
      staggerChildren: 0.055,
      delayChildren: 0.12,
    },
  },
};

export const headerItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -18,
    scale: 0.88,
    filter: "blur(8px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 140,
      damping: 18,
      mass: 0.7,
    },
  },
};

export const headerNavLinkVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -12,
    filter: "blur(6px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.55, ease: HEADER_EASE },
  },
};

/** Stagger container for desktop nav links. */
export const headerNavGroupVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

export type HeaderScrollMotion = {
  reduceMotion: boolean | null;
  scrolled: boolean;
  pillY: MotionValue<number>;
  pillScale: MotionValue<number>;
  pillPadY: MotionValue<number>;
  glowOpacity: MotionValue<number>;
};

/**
 * Document scroll → compact pill + brand glow (header stays visible).
 */
export function useHeaderScrollMotion(): HeaderScrollMotion {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 28);
  });

  const rawProgress = useTransform(scrollY, [0, 140], [0, 1]);
  const progress = useSpring(rawProgress, {
    stiffness: 120,
    damping: 28,
    mass: 0.4,
  });

  const pillY = useTransform(
    progress,
    [0, 1],
    reduceMotion ? [0, 0] : [0, -6],
  );
  const pillScale = useTransform(
    progress,
    [0, 1],
    reduceMotion ? [1, 1] : [1, 0.965],
  );
  const pillPadY = useTransform(
    progress,
    [0, 1],
    reduceMotion ? [12, 12] : [12, 8],
  );
  const glowOpacity = useTransform(
    progress,
    [0, 1],
    reduceMotion ? [0.55, 0.55] : [0.7, 0.22],
  );

  return {
    reduceMotion,
    scrolled,
    pillY,
    pillScale,
    pillPadY,
    glowOpacity,
  };
}
