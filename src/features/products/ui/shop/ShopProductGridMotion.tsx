"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
  type Variants,
} from "motion/react";
import { useRef, type ReactNode, type RefObject } from "react";

export const SHOP_EASE = [0.22, 1, 0.36, 1] as const;

export const shopGridVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.08 },
  },
};

const cardEnterVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 48,
    scale: 0.92,
    filter: "blur(10px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 100, damping: 16 },
  },
};

type ShopProductCardShellProps = {
  children: ReactNode;
  index: number;
  progress: MotionValue<number>;
  reduceMotion: boolean | null;
};

/** Entrance once; continuous scroll float without remounting. */
export function ShopProductCardShell({
  children,
  index,
  progress,
  reduceMotion,
}: ShopProductCardShellProps) {
  const direction = index % 2 === 0 ? 1 : -1;
  const y = useTransform(
    progress,
    [0, 0.5, 1],
    reduceMotion ? [0, 0, 0] : [22 * direction, 0, -26 * direction],
  );

  return (
    <motion.div
      variants={reduceMotion ? undefined : cardEnterVariants}
      className="relative"
      style={{ zIndex: 1000 - index }}
    >
      <motion.div style={{ y }} className="relative h-full will-change-transform">
        {children}
      </motion.div>
    </motion.div>
  );
}

/** Shared scroll progress for shop product grids. */
export function useShopGridScroll(): [
  RefObject<HTMLDivElement | null>,
  MotionValue<number>,
  boolean | null,
] {
  const sectionRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 28,
    mass: 0.45,
  });

  return [sectionRef, progress, reduceMotion];
}
