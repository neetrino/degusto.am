"use client";

import { useInView, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { useEffect, useRef, useState } from "react";

type AboutStatValueProps = {
  value: string;
  className?: string;
  /** Delay before count-up starts (ms). */
  delayMs?: number;
};

function parseStatValue(value: string): {
  target: number;
  suffix: string;
} {
  const match = /^(\d+)(.*)$/.exec(value.trim());
  if (!match) {
    return { target: 0, suffix: value };
  }
  return {
    target: Number(match[1]),
    suffix: match[2] ?? "",
  };
}

/** Dramatic spring count-up for About stats. */
export function AboutStatValue({
  value,
  className = "",
  delayMs = 0,
}: AboutStatValueProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.45 });
  const reduceMotion = useReducedMotion();
  const { target, suffix } = parseStatValue(value);
  const [display, setDisplay] = useState(`0${suffix}`);
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, {
    stiffness: 45,
    damping: 18,
    mass: 1.05,
  });

  useEffect(() => {
    if (!inView || reduceMotion) {
      return;
    }

    const timer = window.setTimeout(() => {
      motionValue.set(0);
      motionValue.set(target);
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [delayMs, inView, motionValue, reduceMotion, target]);

  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      setDisplay(`${Math.round(latest)}${suffix}`);
    });
    return unsubscribe;
  }, [spring, suffix]);

  return (
    <span ref={ref} className={className} aria-label={value}>
      {reduceMotion ? value : display}
    </span>
  );
}
