"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import type { ReactNode } from "react";
import { useRef } from "react";

type HomeMobileMotionShellProps = {
  children: ReactNode;
};

/**
 * Mobile home chrome motion — ring drift on scroll + sheet entrance.
 * Children keep server-friendly composition; this wraps interactive motion only.
 */
export function HomeMobileMotionShell({ children }: HomeMobileMotionShellProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: rootRef,
    offset: ["start start", "end start"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 28,
    mass: 0.4,
  });

  const ringLeft = useTransform(
    progress,
    [0, 1],
    reduceMotion ? [0, 0] : [0, -40],
  );
  const ringRight = useTransform(
    progress,
    [0, 1],
    reduceMotion ? [0, 0] : [0, 48],
  );
  const ringScale = useTransform(
    progress,
    [0, 1],
    reduceMotion ? [1, 1] : [1, 1.12],
  );

  return (
    <div
      ref={rootRef}
      className="relative min-h-screen w-full overflow-x-clip overflow-y-visible bg-[var(--project-color)] lg:hidden"
    >
      <motion.div
        aria-hidden
        style={{ y: ringLeft, scale: ringScale }}
        initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute -top-[123px] -left-[210px] h-[434px] w-[418px] rounded-full border-[80px] border-[#3E573D] will-change-transform"
      />
      <motion.div
        aria-hidden
        style={{ y: ringRight, scale: ringScale }}
        initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        className="pointer-events-none absolute -top-[184px] -right-[160px] h-[320px] w-[360px] rounded-full border-[70px] border-[#3E573D] will-change-transform"
      />
      {children}
    </div>
  );
}

type HomeMobileSheetProps = {
  children: ReactNode;
};

/** White sheet with one-time spring entrance. */
export function HomeMobileSheet({ children }: HomeMobileSheetProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 48 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 110,
        damping: 18,
        delay: 0.2,
      }}
      className="relative z-10 mt-[87px] min-h-[calc(100dvh-10rem)] rounded-t-[30px] bg-white px-0 pt-8 pb-[110px]"
    >
      {children}
    </motion.div>
  );
}
