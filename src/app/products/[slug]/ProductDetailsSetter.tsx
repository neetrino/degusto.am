'use client';

import { useLayoutEffect } from 'react';
import { useProductPageHydration } from './ProductPageHydrationContext';
import type { Product } from './types';
import type { ProductReviewSummary } from '@/lib/services/reviews/product-review-summary';
import type { ProductReviewListItem } from '@/lib/services/reviews.service';

interface ProductDetailsSetterProps {
  product: Product;
  reviewSummary: ProductReviewSummary;
  initialReviews: ProductReviewListItem[];
}

export function ProductDetailsSetter({
  product,
  reviewSummary,
  initialReviews,
}: ProductDetailsSetterProps) {
  const { hydrateDetails } = useProductPageHydration();

  useLayoutEffect(() => {
    hydrateDetails(product, reviewSummary, initialReviews);
  }, [product, reviewSummary, initialReviews, hydrateDetails]);

  return null;
}

export function ProductDetailsNotFoundSetter() {
  const { markNotFound } = useProductPageHydration();

  useLayoutEffect(() => {
    markNotFound();
  }, [markNotFound]);

  return null;
}
