"use client";

import type { ReactNode } from "react";

type ShopSmoothScrollProps = {
  children: ReactNode;
};

/**
 * Shop uses native document scroll. Lenis + Motion filter/transform
 * left catalog cards invisible after search/navigation.
 */
export function ShopSmoothScroll({ children }: ShopSmoothScrollProps) {
  return <>{children}</>;
}
