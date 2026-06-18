import { useState, type ChangeEvent } from 'react';
import { apiClient } from '../../../../lib/api-client';
import { logger } from '../../../../lib/utils/logger';
import { showToast } from '../../../../components/Toast';
import { useTranslation } from '../../../../lib/i18n-client';
import type { Category, CategoryDetails, CategoryFormData } from '../types';
import type { FetchCategoriesFn } from './useCategories';

interface UseCategoryActionsReturn {
  showAddModal: boolean;
  showEditModal: boolean;
  pendingDeleteCategory: { id: string; title: string } | null;
  editingCategory: Category | null;
  formData: CategoryFormData;
  saving: boolean;
  imageUploading: boolean;
  deleting: boolean;
  setShowAddModal: (show: boolean) => void;
  setShowEditModal: (show: boolean) => void;
  setFormData: (data: CategoryFormData) => void;
  handleImageUpload: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  removeImage: () => void;
  handleAddCategory: (fetchCategories: FetchCategoriesFn) => Promise<void>;
  handleEditCategory: (category: Category) => Promise<void>;
  handleUpdateCategory: (fetchCategories: FetchCategoriesFn) => Promise<void>;
  handleDeleteCategory: (categoryId: string, categoryTitle: string) => void;
  cancelDeleteCategory: () => void;
  confirmDeleteCategory: (fetchCategories: FetchCategoriesFn) => Promise<void>;
  resetForm: () => void;
}

const initialFormData: CategoryFormData = {
  titleHy: '',
  titleEn: '',
  titleRu: '',
  requiresSizes: false,
  imageUrl: '',
  published: 'published',
};

type SupportedLocale = 'hy' | 'en' | 'ru';

function getLocaleTitles(formData: CategoryFormData): Record<SupportedLocale, string> {
  return {
    hy: formData.titleHy.trim(),
    en: formData.titleEn.trim(),
    ru: formData.titleRu.trim(),
  };
}

function getPrimaryLocaleTitle(localeTitles: Record<SupportedLocale, string>): { locale: SupportedLocale; title: string } | null {
  if (localeTitles.hy) {
    return { locale: 'hy', title: localeTitles.hy };
  }
  if (localeTitles.en) {
    return { locale: 'en', title: localeTitles.en };
  }
  if (localeTitles.ru) {
    return { locale: 'ru', title: localeTitles.ru };
  }
  return null;
}

/**
 * Hook for category CRUD operations
 */
export function useCategoryActions(): UseCategoryActionsReturn {
  const { t } = useTranslation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [pendingDeleteCategory, setPendingDeleteCategory] = useState<{ id: string; title: string } | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const resetForm = () => {
    setFormData(initialFormData);
  };

  const handleAddCategory = async (fetchCategories: FetchCategoriesFn) => {
    const localeTitles = getLocaleTitles(formData);
    const primaryTranslation = getPrimaryLocaleTitle(localeTitles);

    if (!primaryTranslation) {
      showToast(t('admin.categories.titleRequired'), 'warning');
      return;
    }

    setSaving(true);
    try {
      const createResponse = await apiClient.post<{ data: { id: string } }>('/api/v1/admin/categories', {
        title: primaryTranslation.title,
        requiresSizes: formData.requiresSizes,
        imageUrl: formData.imageUrl.trim() || undefined,
        published: formData.published === 'published',
        locale: primaryTranslation.locale,
      });

      const createdCategoryId = createResponse.data?.id;
      if (createdCategoryId) {
        await Promise.all(
          (Object.keys(localeTitles) as SupportedLocale[])
            .filter((locale) => locale !== primaryTranslation.locale && localeTitles[locale].length > 0)
            .map((locale) =>
              apiClient.put(`/api/v1/admin/categories/${createdCategoryId}`, {
                locale,
                title: localeTitles[locale],
              }),
            ),
        );
      }

      setShowAddModal(false);
      resetForm();
      await fetchCategories({ silent: true });
      showToast(t('admin.categories.createdSuccess'), 'success');
    } catch (err: unknown) {
      logger.error('Error creating category', { error: err });
      const errorMessage = err && typeof err === 'object' && 'data' in err
        ? (err as { data?: { detail?: string } }).data?.detail
        : err && typeof err === 'object' && 'message' in err
        ? (err as { message?: string }).message
        : t('admin.categories.errorCreating');
      showToast(errorMessage || t('admin.categories.errorCreating'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEditCategory = async (category: Category) => {
    setEditingCategory(category);
    
    try {
      const response = await apiClient.get<{ data: CategoryDetails }>(`/api/v1/admin/categories/${category.id}`);
      const categoryWithChildren = response.data;
      const translations = categoryWithChildren.translations || {};
      
      setFormData({
        titleHy: translations.hy || '',
        titleEn: translations.en || '',
        titleRu: translations.ru || '',
        requiresSizes: category.requiresSizes || false,
        imageUrl: category.imageUrl || '',
        published: category.published ? 'published' : 'draft',
      });
    } catch (err: unknown) {
      logger.error('Error fetching category children', { error: err });
      setFormData({
        titleHy: category.title,
        titleEn: '',
        titleRu: '',
        requiresSizes: category.requiresSizes || false,
        imageUrl: category.imageUrl || '',
        published: category.published ? 'published' : 'draft',
      });
    }
    
    setShowEditModal(true);
  };

  const handleUpdateCategory = async (fetchCategories: FetchCategoriesFn) => {
    const localeTitles = getLocaleTitles(formData);
    const primaryTranslation = getPrimaryLocaleTitle(localeTitles);

    if (!editingCategory || !primaryTranslation) {
      showToast(t('admin.categories.titleRequired'), 'warning');
      return;
    }

    setSaving(true);
    try {
      await apiClient.put(`/api/v1/admin/categories/${editingCategory.id}`, {
        title: primaryTranslation.title,
        requiresSizes: formData.requiresSizes,
        imageUrl: formData.imageUrl.trim() || null,
        published: formData.published === 'published',
        locale: primaryTranslation.locale,
      });

      await Promise.all(
        (Object.keys(localeTitles) as SupportedLocale[])
          .filter((locale) => locale !== primaryTranslation.locale && localeTitles[locale].length > 0)
          .map((locale) =>
            apiClient.put(`/api/v1/admin/categories/${editingCategory.id}`, {
              locale,
              title: localeTitles[locale],
            }),
          ),
      );

      setShowEditModal(false);
      setEditingCategory(null);
      resetForm();
      await fetchCategories({ silent: true });
      showToast(t('admin.categories.updatedSuccess'), 'success');
    } catch (err: unknown) {
      logger.error('Error updating category', { error: err });
      const errorMessage = err && typeof err === 'object' && 'data' in err
        ? (err as { data?: { detail?: string } }).data?.detail
        : err && typeof err === 'object' && 'message' in err
        ? (err as { message?: string }).message
        : t('admin.categories.errorUpdating');
      showToast(errorMessage || t('admin.categories.errorUpdating'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const imageFile = files.find((file) => file.type.startsWith('image/'));
    if (!imageFile) {
      showToast(t('admin.attributes.valueModal.selectImageFile'), 'warning');
      if (event.target) {
        event.target.value = '';
      }
      return;
    }

    try {
      setImageUploading(true);
      const base64 = await fileToBase64(imageFile);
      setFormData((current) => ({ ...current, imageUrl: base64 }));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t('admin.attributes.valueModal.failedToProcessImage');
      showToast(errorMessage, 'error');
    } finally {
      setImageUploading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const removeImage = () => {
    setFormData((current) => ({ ...current, imageUrl: '' }));
  };

  const handleDeleteCategory = (categoryId: string, categoryTitle: string) => {
    setPendingDeleteCategory({ id: categoryId, title: categoryTitle });
  };

  const cancelDeleteCategory = () => {
    if (deleting) {
      return;
    }
    setPendingDeleteCategory(null);
  };

  const confirmDeleteCategory = async (fetchCategories: FetchCategoriesFn) => {
    if (!pendingDeleteCategory) {
      return;
    }

    setDeleting(true);
    try {
      logger.info('Deleting category', {
        categoryId: pendingDeleteCategory.id,
        categoryTitle: pendingDeleteCategory.title,
      });
      await apiClient.delete(`/api/v1/admin/categories/${pendingDeleteCategory.id}`);
      logger.info('Category deleted successfully');
      await fetchCategories({ silent: true });
      setPendingDeleteCategory(null);
      showToast(t('admin.categories.deletedSuccess'), 'success');
    } catch (err: unknown) {
      logger.error('Error deleting category', { error: err });
      let errorMessage = 'Unknown error occurred';
      if (err && typeof err === 'object') {
        if ('data' in err && err.data && typeof err.data === 'object' && 'detail' in err.data) {
          errorMessage = String(err.data.detail);
        } else if ('detail' in err) {
          errorMessage = String(err.detail);
        } else if ('message' in err) {
          errorMessage = String(err.message);
        } else if ('response' in err && err.response && typeof err.response === 'object' && 'data' in err.response) {
          const responseData = err.response as { data?: { detail?: string } };
          if (responseData.data?.detail) {
            errorMessage = responseData.data.detail;
          }
        }
      }
      showToast(t('admin.categories.errorDeleting').replace('{message}', errorMessage), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return {
    showAddModal,
    showEditModal,
    pendingDeleteCategory,
    editingCategory,
    formData,
    saving,
    imageUploading,
    deleting,
    setShowAddModal,
    setShowEditModal,
    setFormData,
    handleImageUpload,
    removeImage,
    handleAddCategory,
    handleEditCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    cancelDeleteCategory,
    confirmDeleteCategory,
    resetForm,
  };
}




