"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

type AboutRevealVariant = "up" | "left" | "right";

type AboutRevealProps = {
  children: ReactNode;
  className?: string;
  variant?: AboutRevealVariant;
  /** Pixel offset for the hidden transform. */
  offsetPx?: number;
  delayMs?: number;
  durationMs?: number;
};

function hiddenTransformClass(
  variant: AboutRevealVariant,
): string {
  if (variant === "left") {
    return "-translate-x-[var(--about-reveal-offset)]";
  }
  if (variant === "right") {
    return "translate-x-[var(--about-reveal-offset)]";
  }
  return "translate-y-[var(--about-reveal-offset)]";
}

/**
 * Scroll/mount reveal matching degusto-am.vercel.app/about
 * (opacity + translate, one-shot IntersectionObserver).
 */
export function AboutReveal({
  children,
  className = "",
  variant = "up",
  offsetPx,
  delayMs = 0,
  durationMs = 700,
}: AboutRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  const offset =
    offsetPx ?? (variant === "up" ? 18 : 28);

  useEffect(() => {
    const node = ref.current;
    if (!node || visible) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }
        setVisible(true);
        observer.disconnect();
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div
      ref={ref}
      className={[
        className,
        "transition-[opacity,transform] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transform-none motion-reduce:opacity-100 motion-reduce:transition-none",
        visible
          ? "translate-x-0 translate-y-0 opacity-100"
          : `opacity-0 ${hiddenTransformClass(variant)}`,
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        {
          "--about-reveal-offset": `${offset}px`,
          transitionDuration: `${durationMs}ms`,
          transitionDelay: visible ? `${delayMs}ms` : "0ms",
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
