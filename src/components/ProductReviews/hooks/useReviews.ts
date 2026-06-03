'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../../lib/api-client';
import type { Review } from '../utils';
import { logger } from '@/lib/utils/logger';

/**
 * Fetches product reviews once per slug + productId pair.
 * Pass `productId` to use the PDP fast path (`?productId=` on the API).
 */
import type { ProductReviewListItem } from '@/lib/services/reviews.service';

interface UseReviewsOptions {
  enabled?: boolean;
  /** When set, skips the initial client fetch (server-rendered list). */
  initialReviews?: ProductReviewListItem[];
}

export function useReviews(
  productId: string | undefined,
  productSlug: string | undefined,
  options?: UseReviewsOptions
) {
  const enabled = options?.enabled ?? true;
  const serverReviews = options?.initialReviews;
  const [reviews, setReviews] = useState<Review[]>(() => serverReviews ?? []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (serverReviews !== undefined) {
      setReviews(serverReviews);
    }
  }, [productId, serverReviews]);

  const loadReviews = useCallback(async () => {
    const slug = productSlug?.trim();
    if (!slug) {
      setReviews([]);
      setLoading(false);
      return;
    }

    const id = productId?.trim();
    if (!id) {
      setReviews([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const encodedSlug = encodeURIComponent(slug);
      const data = await apiClient.get<Review[]>(`/api/v1/products/${encodedSlug}/reviews`, {
        params: { productId: id },
      });
      setReviews(data ?? []);
    } catch (error: unknown) {
      const err = error as { status?: number };
      if (err.status !== 404) {
        logger.warn('[PRODUCT REVIEWS] Failed to load reviews', {
          slug,
          productId: id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [productId, productSlug]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    if (serverReviews !== undefined) {
      return;
    }
    void loadReviews();
  }, [loadReviews, enabled, serverReviews]);

  useEffect(() => {
    const handleReviewUpdate = () => {
      void loadReviews();
    };
    window.addEventListener('review-updated', handleReviewUpdate);
    return () => window.removeEventListener('review-updated', handleReviewUpdate);
  }, [loadReviews]);

  return {
    reviews,
    loading,
    setReviews,
    loadReviews,
  };
}
