"use client";

import { ReactLenis } from "lenis/react";
import type { ReactNode } from "react";

type ShopSmoothScrollProps = {
  children: ReactNode;
};

/** Lenis smooth scroll for the shop catalog experience. */
export function ShopSmoothScroll({ children }: ShopSmoothScrollProps) {
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
