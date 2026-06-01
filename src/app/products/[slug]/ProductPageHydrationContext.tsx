'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Product } from './types';
import type { ProductReviewSummary } from '@/lib/services/reviews/product-review-summary';
import type { ProductReviewListItem } from '@/lib/services/reviews.service';

interface ProductPageHydrationContextValue {
  hydrateDetails: (
    product: Product,
    reviewSummary: ProductReviewSummary,
    initialReviews: ProductReviewListItem[]
  ) => void;
  markNotFound: () => void;
}

const ProductPageHydrationContext = createContext<ProductPageHydrationContextValue | null>(
  null
);

export function ProductPageHydrationProvider({
  children,
  hydrateDetails,
  markNotFound,
}: {
  children: ReactNode;
  hydrateDetails: (
    product: Product,
    reviewSummary: ProductReviewSummary,
    initialReviews: ProductReviewListItem[]
  ) => void;
  markNotFound: () => void;
}) {
  return (
    <ProductPageHydrationContext.Provider value={{ hydrateDetails, markNotFound }}>
      {children}
    </ProductPageHydrationContext.Provider>
  );
}

export function useProductPageHydration(): ProductPageHydrationContextValue {
  const ctx = useContext(ProductPageHydrationContext);
  if (!ctx) {
    throw new Error('useProductPageHydration must be used within ProductPageHydrationProvider');
  }
  return ctx;
}
