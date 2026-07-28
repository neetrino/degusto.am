"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";

type AboutMissionTitleProps = {
  text: string;
  className?: string;
};

const EASE = [0.22, 1, 0.36, 1] as const;

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.03, delayChildren: 0.06 },
  },
};

const charVariants: Variants = {
  hidden: { y: "115%", rotateX: 75, opacity: 0, filter: "blur(8px)" },
  visible: {
    y: "0%",
    rotateX: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: 0.55, ease: EASE },
  },
};

/** Master-style character cascade for mission headings. */
export function AboutMissionTitle({ text, className = "" }: AboutMissionTitleProps) {
  const reduceMotion = useReducedMotion();
  const chars = Array.from(text);

  if (reduceMotion) {
    return <h2 className={className}>{text}</h2>;
  }

  return (
    <motion.h2
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.5 }}
      variants={containerVariants}
      style={{ perspective: 700 }}
      aria-label={text}
    >
      {chars.map((char, index) => (
        <span key={`${char}-${index}`} className="inline-block overflow-hidden align-bottom">
          <motion.span
            variants={charVariants}
            className="inline-block"
            aria-hidden
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        </span>
      ))}
    </motion.h2>
  );
}
