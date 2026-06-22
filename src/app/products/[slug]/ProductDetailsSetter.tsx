'use client';

import { useLayoutEffect } from 'react';
import { useProductPageHydration } from './ProductPageHydrationContext';
import type { Product } from './types';
import type { ProductReviewSummary } from '@/lib/services/reviews/product-review-summary';

interface ProductDetailsSetterProps {
  product: Product;
  reviewSummary: ProductReviewSummary;
}

export function ProductDetailsSetter({
  product,
  reviewSummary,
}: ProductDetailsSetterProps) {
  const { hydrateDetails } = useProductPageHydration();

  useLayoutEffect(() => {
    hydrateDetails(product, reviewSummary);
  }, [product, reviewSummary, hydrateDetails]);

  return null;
}

export function ProductDetailsNotFoundSetter() {
  const { markNotFound } = useProductPageHydration();

  useLayoutEffect(() => {
    markNotFound();
  }, [markNotFound]);

  return null;
}

export function ProductDetailsErrorSetter() {
  const { markHydrationError } = useProductPageHydration();

  useLayoutEffect(() => {
    markHydrationError();
  }, [markHydrationError]);

  return null;
}
