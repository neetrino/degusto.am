'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthContext';
import { Card, Button, Input } from '@shop/ui';
import { useTranslation } from '../../../lib/i18n-client';
import { useCategories } from './hooks/useCategories';
import { useCategoryActions } from './hooks/useCategoryActions';
import { CategoriesList } from './components/CategoriesList';
import { AddCategoryModal } from './components/AddCategoryModal';
import { EditCategoryModal } from './components/EditCategoryModal';
import { DeleteCategoryModal } from './components/DeleteCategoryModal';

export default function CategoriesPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const { categories, loading, fetchCategories } = useCategories();
  const {
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
  } = useCategoryActions();

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn || !isAdmin) {
        router.push('/supersudo');
        return;
      }
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900" />
          <p className="text-gray-600">{t('admin.common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) {
    return null;
  }

  return (
    <>
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">{t('admin.categories.title')}</h2>
          <Button
            variant="primary"
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('admin.categories.addCategory')}
          </Button>
        </div>
        <div className="mb-4">
          <Input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('admin.categories.categoryTitlePlaceholder')}
            className="max-w-md"
          />
        </div>

        {loading ? (
          <div className="py-4 text-center">
            <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-b-2 border-gray-900" />
            <p className="text-sm text-gray-600">{t('admin.categories.loadingCategories')}</p>
          </div>
        ) : (
          <CategoriesList
            categories={categories}
            searchQuery={searchQuery}
            onEdit={handleEditCategory}
            onDelete={handleDeleteCategory}
          />
        )}
      </Card>

      <AddCategoryModal
        isOpen={showAddModal}
        formData={formData}
        categories={categories}
        saving={saving}
        imageUploading={imageUploading}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        onFormDataChange={setFormData}
        onImageUpload={handleImageUpload}
        onRemoveImage={removeImage}
        onSubmit={() => handleAddCategory(fetchCategories)}
      />

      <EditCategoryModal
        isOpen={showEditModal}
        editingCategory={editingCategory}
        formData={formData}
        categories={categories}
        saving={saving}
        imageUploading={imageUploading}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
        }}
        onFormDataChange={setFormData}
        onImageUpload={handleImageUpload}
        onRemoveImage={removeImage}
        onSubmit={() => handleUpdateCategory(fetchCategories)}
      />

      <DeleteCategoryModal
        isOpen={pendingDeleteCategory !== null}
        categoryTitle={pendingDeleteCategory?.title ?? ''}
        deleting={deleting}
        onCancel={cancelDeleteCategory}
        onConfirm={() => confirmDeleteCategory(fetchCategories)}
      />
    </>
  );
}
