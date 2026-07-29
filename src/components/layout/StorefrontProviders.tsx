"use client";

import type { ReactNode } from "react";

import { CatalogNavProvider } from "@/features/products/ui/shop/CatalogNavContext";

type StorefrontProvidersProps = {
  children: ReactNode;
};

/** Client providers shared across the storefront shell. */
export function StorefrontProviders({ children }: StorefrontProvidersProps) {
  return <CatalogNavProvider>{children}</CatalogNavProvider>;
}
