"use client";

import { ReactLenis } from "lenis/react";
import type { ReactNode } from "react";

type AboutSmoothScrollProps = {
  children: ReactNode;
};

/** Lenis smooth scroll scoped to the About page experience. */
export function AboutSmoothScroll({ children }: AboutSmoothScrollProps) {
  return (
    <ReactLenis
      root
      options={{
        duration: 1.15,
        smoothWheel: true,
        touchMultiplier: 1.4,
      }}
    >
      {children}
    </ReactLenis>
  );
}
