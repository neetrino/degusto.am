'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/api-client';
import { getStoredLanguage } from '../../../lib/language';
import type { CategoryNavPreviewProduct } from '@/lib/services/categories-navigation-previews.service';
import { logger } from '@/lib/utils/logger';

interface PreviewsResponse {
  data: Record<string, CategoryNavPreviewProduct | null>;
}

/**
 * Loads one preview product per category nav slot via a single API call
 * (replaces N parallel /products requests).
 */
export function useCategoryProducts() {
  const [categoryProducts, setCategoryProducts] = useState<
    Record<string, CategoryNavPreviewProduct | null>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreviews = async () => {
      try {
        setLoading(true);
        const language = getStoredLanguage();
        const response = await apiClient.get<PreviewsResponse>(
          '/api/v1/categories/navigation-previews',
          { params: { lang: language } }
        );
        setCategoryProducts(response.data ?? {});
      } catch (err) {
        logger.error('[CategoryNavigation] Failed to load navigation previews', err);
        setCategoryProducts({});
      } finally {
        setLoading(false);
      }
    };

    void fetchPreviews();

    const onLang = () => void fetchPreviews();
    window.addEventListener('language-updated', onLang);
    return () => window.removeEventListener('language-updated', onLang);
  }, []);

  return { categoryProducts, loading };
}
