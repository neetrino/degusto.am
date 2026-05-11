'use client';

import { Button, Input } from '@shop/ui';
import { type ChangeEvent } from 'react';
import { useTranslation } from '../../../../lib/i18n-client';
import type { Category, CategoryFormData } from '../types';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface EditCategoryModalProps {
  isOpen: boolean;
  editingCategory: Category | null;
  formData: CategoryFormData;
  categories: Category[];
  saving: boolean;
  imageUploading: boolean;
  onClose: () => void;
  onFormDataChange: (data: CategoryFormData) => void;
  onImageUpload: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onRemoveImage: () => void;
  onSubmit: () => Promise<void>;
}

export function EditCategoryModal({
  isOpen,
  editingCategory,
  formData,
  categories,
  saving,
  imageUploading,
  onClose,
  onFormDataChange,
  onImageUpload,
  onRemoveImage,
  onSubmit,
}: EditCategoryModalProps) {
  const { t } = useTranslation();
  useBodyScrollLock(isOpen && Boolean(editingCategory));

  if (!isOpen || !editingCategory) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.categories.editCategory')}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin.categories.categoryTitle')} *
            </label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) => onFormDataChange({ ...formData, title: e.target.value })}
              placeholder={t('admin.categories.categoryTitlePlaceholder')}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin.categories.parentCategory')}
            </label>
            <select
              value={formData.parentId}
              onChange={(e) =>
                onFormDataChange({
                  ...formData,
                  parentId: e.target.value,
                  subcategoryIds: e.target.value ? [] : formData.subcategoryIds,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('admin.categories.rootCategory')}</option>
              {categories
                .filter((cat) => 
                  cat.id !== editingCategory.id && !cat.parentId
                )
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.title}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin.categories.status')}
            </label>
            <select
              value={formData.published}
              onChange={(e) =>
                onFormDataChange({
                  ...formData,
                  published: e.target.value as CategoryFormData['published'],
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="published">{t('admin.categories.published')}</option>
              <option value="draft">{t('admin.categories.draft')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.categories.image')}
            </label>
            {formData.imageUrl ? (
              <div className="space-y-3">
                <div className="relative inline-block">
                  <img
                    src={formData.imageUrl}
                    alt={t('admin.categories.imagePreview')}
                    className="h-24 w-24 rounded-lg border border-gray-300 object-cover"
                  />
                  <button
                    type="button"
                    onClick={onRemoveImage}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white transition-colors hover:bg-red-700"
                    title={t('admin.categories.removeImage')}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : null}
            <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-200">
              {imageUploading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-600 border-t-transparent" />
                  {t('admin.categories.uploadingImage')}
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {formData.imageUrl ? t('admin.categories.changeImage') : t('admin.categories.uploadImage')}
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  void onImageUpload(event);
                }}
                disabled={imageUploading}
              />
            </label>
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requiresSizes}
                onChange={(e) => onFormDataChange({ ...formData, requiresSizes: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                {t('admin.categories.requiresSizes')}
              </span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subcategories
            </label>
            <div
              className={`max-h-60 overflow-y-auto border border-gray-300 rounded-md p-3 space-y-2 ${
                formData.parentId ? 'opacity-60' : ''
              }`}
            >
              {formData.parentId && (
                <p className="text-xs text-gray-500 pb-2">
                  Subcategories are available only for root categories.
                </p>
              )}
              {categories
                .filter((cat) => cat.id !== editingCategory.id && cat.id !== formData.parentId)
                .map((cat) => {
                  const isChecked = formData.subcategoryIds.includes(cat.id);
                  return (
                    <label key={cat.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={Boolean(formData.parentId)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            onFormDataChange({
                              ...formData,
                              subcategoryIds: [...formData.subcategoryIds, cat.id],
                            });
                          } else {
                            onFormDataChange({
                              ...formData,
                              subcategoryIds: formData.subcategoryIds.filter(id => id !== cat.id),
                            });
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{cat.title}</span>
                    </label>
                  );
                })}
              {categories.filter((cat) => 
                cat.id !== editingCategory.id && 
                cat.parentId !== editingCategory.id
              ).length === 0 && (
                <p className="text-sm text-gray-500">No available categories to assign as subcategories</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button
            variant="primary"
            onClick={onSubmit}
            disabled={saving || imageUploading || !formData.title.trim()}
            className="flex-1"
          >
            {saving ? t('admin.categories.updating') : t('admin.categories.updateCategory')}
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={saving}
          >
            {t('admin.common.cancel')}
          </Button>
        </div>
      </div>
    </div>
  );
}




