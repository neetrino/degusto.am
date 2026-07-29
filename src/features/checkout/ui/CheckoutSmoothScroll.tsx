"use client";

import { ReactLenis } from "lenis/react";
import type { ReactNode } from "react";

type CheckoutSmoothScrollProps = {
  children: ReactNode;
};

/** Lenis smooth scroll for the checkout experience. */
export function CheckoutSmoothScroll({ children }: CheckoutSmoothScrollProps) {
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
