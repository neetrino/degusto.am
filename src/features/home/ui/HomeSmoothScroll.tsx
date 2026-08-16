"use client";

import { ReactLenis } from "lenis/react";
import type { ReactNode } from "react";

type HomeSmoothScrollProps = {
  children: ReactNode;
};

/** Lenis smooth scroll for the home page experience. */
export function HomeSmoothScroll({ children }: HomeSmoothScrollProps) {
  return (
    <ReactLenis
      root
      options={{
        duration: 0.55,
        lerp: 0.14,
        smoothWheel: true,
        wheelMultiplier: 1.45,
        touchMultiplier: 1.4,
      }}
    >
      {children}
    </ReactLenis>
  );
}
