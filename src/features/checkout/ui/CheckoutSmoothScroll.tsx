"use client";

import type { ReactNode } from "react";

type CheckoutSmoothScrollProps = {
  children: ReactNode;
};

/**
 * Checkout uses native document scroll so `position: sticky` on the
 * order summary keeps working. Lenis transforms break sticky.
 */
export function CheckoutSmoothScroll({ children }: CheckoutSmoothScrollProps) {
  return <>{children}</>;
}
