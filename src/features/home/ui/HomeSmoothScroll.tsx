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
        duration: 1.15,
        smoothWheel: true,
        touchMultiplier: 1.4,
      }}
    >
      {children}
    </ReactLenis>
  );
}
