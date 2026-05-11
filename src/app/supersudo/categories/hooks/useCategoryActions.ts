import { useState, type ChangeEvent } from 'react';
import { apiClient } from '../../../../lib/api-client';
import { logger } from '../../../../lib/utils/logger';
import { showToast } from '../../../../components/Toast';
import { useTranslation } from '../../../../lib/i18n-client';
import type { Category, CategoryFormData } from '../types';

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
  handleAddCategory: (fetchCategories: () => Promise<void>) => Promise<void>;
  handleEditCategory: (category: Category) => Promise<void>;
  handleUpdateCategory: (fetchCategories: () => Promise<void>) => Promise<void>;
  handleDeleteCategory: (categoryId: string, categoryTitle: string) => void;
  cancelDeleteCategory: () => void;
  confirmDeleteCategory: (fetchCategories: () => Promise<void>) => Promise<void>;
  resetForm: () => void;
}

const initialFormData: CategoryFormData = {
  title: '',
  parentId: '',
  requiresSizes: false,
  subcategoryIds: [],
  imageUrl: '',
  published: 'published',
};

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

  const handleAddCategory = async (fetchCategories: () => Promise<void>) => {
    if (!formData.title.trim()) {
      showToast(t('admin.categories.titleRequired'), 'warning');
      return;
    }

    setSaving(true);
    try {
      await apiClient.post('/api/v1/admin/categories', {
        title: formData.title.trim(),
        parentId: formData.parentId || undefined,
        requiresSizes: formData.requiresSizes,
        imageUrl: formData.imageUrl.trim() || undefined,
        published: formData.published === 'published',
        locale: 'en',
      });
      setShowAddModal(false);
      resetForm();
      await fetchCategories();
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
      const response = await apiClient.get<{ data: Category }>(`/api/v1/admin/categories/${category.id}`);
      const categoryWithChildren = response.data;
      
      setFormData({
        title: category.title,
        parentId: category.parentId || '',
        requiresSizes: category.requiresSizes || false,
        subcategoryIds: categoryWithChildren.children?.map(child => child.id) || [],
        imageUrl: category.imageUrl || '',
        published: category.published ? 'published' : 'draft',
      });
    } catch (err: unknown) {
      logger.error('Error fetching category children', { error: err });
      setFormData({
        title: category.title,
        parentId: category.parentId || '',
        requiresSizes: category.requiresSizes || false,
        subcategoryIds: [],
        imageUrl: category.imageUrl || '',
        published: category.published ? 'published' : 'draft',
      });
    }
    
    setShowEditModal(true);
  };

  const handleUpdateCategory = async (fetchCategories: () => Promise<void>) => {
    if (!editingCategory || !formData.title.trim()) {
      showToast(t('admin.categories.titleRequired'), 'warning');
      return;
    }

    setSaving(true);
    try {
      const normalizedParentId = formData.parentId || null;
      const sanitizedSubcategoryIds = normalizedParentId
        ? []
        : Array.from(new Set(formData.subcategoryIds)).filter((subcategoryId) => subcategoryId !== editingCategory.id);

      await apiClient.put(`/api/v1/admin/categories/${editingCategory.id}`, {
        title: formData.title.trim(),
        parentId: normalizedParentId,
        requiresSizes: formData.requiresSizes,
        subcategoryIds: sanitizedSubcategoryIds,
        imageUrl: formData.imageUrl.trim() || null,
        published: formData.published === 'published',
        locale: 'en',
      });
      setShowEditModal(false);
      setEditingCategory(null);
      resetForm();
      await fetchCategories();
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

  const confirmDeleteCategory = async (fetchCategories: () => Promise<void>) => {
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
      await fetchCategories();
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




