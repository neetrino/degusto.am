"use client";

import type { ReactNode } from "react";

type ProductSmoothScrollProps = {
  children: ReactNode;
};

/**
 * PDP uses native document scroll. Lenis + nested horizontal carousels
 * swallows wheel events and blocks page scroll over related products.
 */
export function ProductSmoothScroll({ children }: ProductSmoothScrollProps) {
  return <>{children}</>;
}
