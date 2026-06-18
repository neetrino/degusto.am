import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../../../lib/api-client';
import { logger } from '../../../../lib/utils/logger';
import type { Category } from '../types';
import type { LanguageCode } from '../../../../lib/language';

export type FetchCategoriesOptions = {
  /** When true, keep the list visible (no full-page loading spinner). */
  silent?: boolean;
};

export type FetchCategoriesFn = (options?: FetchCategoriesOptions) => Promise<void>;

interface UseCategoriesReturn {
  categories: Category[];
  loading: boolean;
  error: string | null;
  fetchCategories: FetchCategoriesFn;
  applyCategoryReorder: (orderedIds: string[]) => void;
}

/**
 * Hook for fetching and managing categories
 */
export function useCategories(locale: LanguageCode): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback<FetchCategoriesFn>(async (options) => {
    const silent = options?.silent ?? false;
    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);
      logger.debug('Fetching categories', { silent, locale });
      const response = await apiClient.get<{ data: Category[] }>(`/api/v1/admin/categories?locale=${locale}`);
      setCategories(response.data || []);
      logger.info('Categories loaded', { count: response.data?.length || 0 });
    } catch (err: unknown) {
      logger.error('Error fetching categories', { error: err });
      if (!silent) {
        setCategories([]);
      }
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [locale]);

  const applyCategoryReorder = useCallback((orderedIds: string[]) => {
    const positionById = new Map(orderedIds.map((id, index) => [id, index]));
    setCategories((prev) =>
      prev.map((category) => {
        const nextPosition = positionById.get(category.id);
        if (nextPosition === undefined) {
          return category;
        }
        return { ...category, position: nextPosition };
      }),
    );
  }, []);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  return { categories, loading, error, fetchCategories, applyCategoryReorder };
}
