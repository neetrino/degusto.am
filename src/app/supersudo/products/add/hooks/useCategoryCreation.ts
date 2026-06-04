import { apiClient } from '@/lib/api-client';
import { useTranslation } from '@/lib/i18n-client';
import type { Category } from '../types';
import { logger } from '@/lib/utils/logger';

interface UseCategoryCreationProps {
  formData: {
    primaryCategoryId: string;
  };
  useNewCategory: boolean;
  newCategoryName: string;
  setCategories: (updater: (prev: Category[]) => Category[]) => void;
  setLoading: (loading: boolean) => void;
}

export function useCategoryCreation({
  formData,
  useNewCategory,
  newCategoryName,
  setCategories,
  setLoading,
}: UseCategoryCreationProps) {
  const { t } = useTranslation();

  const createCategoryIfNeeded = async (): Promise<{
    finalPrimaryCategoryId: string;
    creationMessages: string[];
    error: boolean;
  }> => {
    const creationMessages: string[] = [];
    let finalPrimaryCategoryId = formData.primaryCategoryId;

    if (useNewCategory && newCategoryName.trim()) {
      try {
        logger.debug('📁 [ADMIN] Creating new category:', newCategoryName);
        const categoryResponse = await apiClient.post<{ data: Category }>('/api/v1/admin/categories', {
          title: newCategoryName.trim(),
          locale: 'en',
          requiresSizes: false,
        });
        if (categoryResponse.data) {
          finalPrimaryCategoryId = categoryResponse.data.id;
          setCategories((prev) => [...prev, categoryResponse.data]);
          logger.debug('✅ [ADMIN] Category created:', categoryResponse.data.id);
          creationMessages.push(
            t('admin.products.add.categoryCreatedSuccess').replace('{name}', newCategoryName.trim())
          );
        }
      } catch (err: unknown) {
        logger.error('❌ [ADMIN] Error creating category', {
          error: err instanceof Error ? err.message : String(err),
        });
        setLoading(false);
        return { finalPrimaryCategoryId, creationMessages, error: true };
      }
    }

    return { finalPrimaryCategoryId, creationMessages, error: false };
  };

  return { createCategoryIfNeeded };
}
