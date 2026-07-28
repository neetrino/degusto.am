"use client";

import { ReactLenis } from "lenis/react";
import type { ReactNode } from "react";

type ProductSmoothScrollProps = {
  children: ReactNode;
};

/** Lenis smooth scroll for the product detail experience. */
export function ProductSmoothScroll({ children }: ProductSmoothScrollProps) {
  return (
    <ReactLenis
      root
      options={{
        duration: 1.2,
        smoothWheel: true,
        touchMultiplier: 1.4,
      }}
    >
      {children}
    </ReactLenis>
  );
}
