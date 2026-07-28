"use client";

import { motion, useReducedMotion } from "motion/react";

type AboutPrinciplesMarqueeProps = {
  principles: readonly string[];
};

/** Infinite brand principles marquee (Motion). */
export function AboutPrinciplesMarquee({
  principles,
}: AboutPrinciplesMarqueeProps) {
  const reduceMotion = useReducedMotion();
  const items = [...principles, ...principles, ...principles];

  return (
    <section
      aria-label={principles.join(", ")}
      className="relative overflow-hidden border-y border-[#3e573d]/12 bg-brand-forest py-5 md:py-6"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-brand-forest to-transparent md:w-28"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-brand-forest to-transparent md:w-28"
      />

      <motion.div
        className="flex w-max gap-10 whitespace-nowrap md:gap-14"
        animate={reduceMotion ? undefined : { x: ["0%", "-33.333%"] }}
        transition={
          reduceMotion
            ? undefined
            : {
                duration: 28,
                ease: "linear",
                repeat: Number.POSITIVE_INFINITY,
              }
        }
      >
        {items.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="inline-flex items-center gap-10 font-display text-2xl font-black tracking-tight text-white/95 md:gap-14 md:text-3xl"
          >
            {item}
            <span className="inline-block size-2 rounded-full bg-brand" />
          </span>
        ))}
      </motion.div>
    </section>
  );
}
