'use client';

import { useMemo, useState } from 'react';
import { Input } from '@shop/ui';
import { useTranslation } from '../../../lib/i18n-client';
import { useAttributes } from './useAttributes';
import { AttributesPageLoading } from './AttributesPageLoading';
import { AttributesAddAttributeForm } from './AttributesAddAttributeForm';
import { AttributeListItem } from './AttributeListItem';

export function AttributesPageContent() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const {
    attributes,
    loading,
    showAddForm,
    editingAttribute,
    editingAttributeName,
    savingAttribute,
    expandedAttributes,
    formData,
    newValue,
    newValuePriceAdjustment,
    addingValueTo,
    deletingValue,
    valueError,
    expandedValueId,
    editingLabel,
    editingColors,
    editingImageUrl,
    editingPriceAdjustment,
    savingValue,
    imageUploading,
    fileInputRef,
    setShowAddForm,
    setFormData,
    setNewValue,
    setNewValuePriceAdjustment,
    setEditingAttributeName,
    setEditingLabel,
    setEditingColors,
    setEditingImageUrl,
    setEditingPriceAdjustment,
    setValueError,
    handleCreateAttribute,
    handleDeleteAttribute,
    handleUpdateAttributeName,
    toggleAttributeEdit,
    handleAddValue,
    handleDeleteValue,
    toggleValueEdit,
    handleImageUpload,
    handleRemoveImage,
    handleSaveInlineValue,
    toggleExpand,
  } = useAttributes();
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredAttributes = useMemo(() => {
    if (!normalizedSearch) {
      return attributes;
    }

    return attributes.filter((attribute) => {
      const attributeMatches =
        attribute.name.toLowerCase().includes(normalizedSearch) ||
        attribute.key.toLowerCase().includes(normalizedSearch);

      if (attributeMatches) {
        return true;
      }

      return attribute.values.some((value) =>
        value.label.toLowerCase().includes(normalizedSearch),
      );
    });
  }, [attributes, normalizedSearch]);

  if (loading) {
    return <AttributesPageLoading />;
  }

  const listItemProps = {
    editingAttribute,
    editingAttributeName,
    savingAttribute,
    newValue,
    newValuePriceAdjustment,
    addingValueTo,
    deletingValue,
    valueError,
    expandedValueId,
    editingLabel,
    editingColors,
    editingImageUrl,
    editingPriceAdjustment,
    savingValue,
    imageUploading,
    fileInputRef,
    onToggleExpand: toggleExpand,
    onEditingAttributeNameChange: setEditingAttributeName,
    onUpdateAttributeName: handleUpdateAttributeName,
    onToggleAttributeEdit: toggleAttributeEdit,
    onDeleteAttribute: handleDeleteAttribute,
    onNewValueChange: setNewValue,
    onNewValuePriceAdjustmentChange: setNewValuePriceAdjustment,
    onValueErrorClear: () => setValueError(null),
    onAddValue: handleAddValue,
    onToggleValueEdit: toggleValueEdit,
    onDeleteValue: handleDeleteValue,
    onEditingLabelChange: setEditingLabel,
    onEditingColorsChange: setEditingColors,
    onEditingPriceAdjustmentChange: setEditingPriceAdjustment,
    onImageUpload: handleImageUpload,
    onRemoveImage: handleRemoveImage,
    onSaveInlineValue: handleSaveInlineValue,
  };

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-gray-600">{t('admin.attributes.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {showAddForm ? t('admin.attributes.cancel') : t('admin.attributes.addAttribute')}
        </button>
      </div>
      <div className="mb-6">
        <Input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={t('admin.attributes.namePlaceholder')}
          className="max-w-md"
        />
      </div>

      {showAddForm && (
        <AttributesAddAttributeForm
          formData={formData}
          onFormDataChange={setFormData}
          onSubmit={handleCreateAttribute}
          onCancel={() => {
            setShowAddForm(false);
            setFormData({ name: '' });
          }}
        />
      )}

      {filteredAttributes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('admin.attributes.noAttributes')}</h3>
          <p className="text-gray-600 mb-4">{t('admin.attributes.getStarted')}</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            {t('admin.attributes.createAttribute')}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAttributes.map((attribute) => (
            <AttributeListItem
              key={attribute.id}
              attribute={attribute}
              isExpanded={expandedAttributes.has(attribute.id)}
              {...listItemProps}
            />
          ))}
        </div>
      )}
    </>
  );
}
