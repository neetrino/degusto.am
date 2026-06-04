'use client';

import { useTranslation } from '../../../lib/i18n-client';
import { type Attribute, type AttributeValue } from './useAttributes';
import { ValueEditForm } from './ValueEditForm';

export interface AttributeListItemProps {
  attribute: Attribute;
  isExpanded: boolean;
  editingAttribute: string | null;
  editingAttributeName: string;
  savingAttribute: boolean;
  newValue: string;
  newValuePriceAdjustment: string;
  addingValueTo: string | null;
  deletingValue: string | null;
  valueError: string | null;
  expandedValueId: string | null;
  editingLabel: string;
  editingColors: string[];
  editingImageUrl: string | null;
  editingPriceAdjustment: string;
  savingValue: boolean;
  imageUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onToggleExpand: (attributeId: string) => void;
  onEditingAttributeNameChange: (name: string) => void;
  onUpdateAttributeName: (attributeId: string) => void;
  onToggleAttributeEdit: (attribute: Attribute) => void;
  onDeleteAttribute: (attributeId: string, attributeName: string) => void;
  onNewValueChange: (value: string) => void;
  onNewValuePriceAdjustmentChange: (value: string) => void;
  onValueErrorClear: () => void;
  onAddValue: (attributeId: string) => void;
  onToggleValueEdit: (attributeId: string, value: AttributeValue) => void;
  onDeleteValue: (attributeId: string, valueId: string, valueLabel: string) => void;
  onEditingLabelChange: (label: string) => void;
  onEditingColorsChange: (colors: string[]) => void;
  onEditingPriceAdjustmentChange: (value: string) => void;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  onSaveInlineValue: () => void;
}

export function AttributeListItem({
  attribute,
  isExpanded,
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
  onToggleExpand,
  onEditingAttributeNameChange,
  onUpdateAttributeName,
  onToggleAttributeEdit,
  onDeleteAttribute,
  onNewValueChange,
  onNewValuePriceAdjustmentChange,
  onValueErrorClear,
  onAddValue,
  onToggleValueEdit,
  onDeleteValue,
  onEditingLabelChange,
  onEditingColorsChange,
  onEditingPriceAdjustmentChange,
  onImageUpload,
  onRemoveImage,
  onSaveInlineValue,
}: AttributeListItemProps) {
  const { t } = useTranslation();
  const isEditingName = editingAttribute === attribute.id;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={() => onToggleExpand(attribute.id)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="flex-1">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editingAttributeName}
                  onChange={(e) => onEditingAttributeNameChange(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && editingAttributeName.trim()) {
                      onUpdateAttributeName(attribute.id);
                    }
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-lg font-semibold"
                  autoFocus
                />
                <button
                  onClick={() => onUpdateAttributeName(attribute.id)}
                  disabled={!editingAttributeName.trim() || savingAttribute}
                  className="px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {savingAttribute ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('admin.attributes.saving') || 'Saving...'}
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t('admin.attributes.save') || 'Save'}
                    </>
                  )}
                </button>
                <button
                  onClick={() => onToggleAttributeEdit(attribute)}
                  disabled={savingAttribute}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  {t('admin.attributes.cancel')}
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">{attribute.name}</h3>
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">{attribute.key}</span>
                  {attribute.filterable && (
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      {t('admin.attributes.filterable')}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {attribute.values.length === 1
                    ? t('admin.attributes.values').replace('{count}', attribute.values.length.toString())
                    : t('admin.attributes.valuesPlural').replace(
                        '{count}',
                        attribute.values.length.toString(),
                      )}
                </p>
              </>
            )}
          </div>
        </div>
        {!isEditingName && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleAttributeEdit(attribute)}
              className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title={t('admin.attributes.editAttribute') || 'Edit attribute'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            <button
              onClick={() => onDeleteAttribute(attribute.id, attribute.name)}
              className="px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
              title={t('admin.attributes.deleteAttribute')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="mb-4">
            <div className="flex flex-wrap gap-2 items-start">
              <div className="flex-1 min-w-[12rem]">
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => {
                    onNewValueChange(e.target.value);
                    if (valueError) {
                      onValueErrorClear();
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newValue.trim()) {
                      onAddValue(attribute.id);
                    }
                  }}
                  placeholder={t('admin.attributes.addNewValue')}
                  className={`
                    w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors
                    ${
                      valueError
                        ? 'border-red-300 bg-red-50 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-gray-900'
                    }
                  `}
                />
                {valueError && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {valueError}
                  </p>
                )}
              </div>
              <div className="w-28">
                <label className="sr-only" htmlFor={`new-value-price-${attribute.id}`}>
                  {t('admin.attributes.valueModal.priceAdjustment')}
                </label>
                <input
                  id={`new-value-price-${attribute.id}`}
                  type="number"
                  step="any"
                  value={newValuePriceAdjustment}
                  onChange={(e) => onNewValuePriceAdjustmentChange(e.target.value)}
                  placeholder="0"
                  title={t('admin.attributes.valueModal.priceAdjustmentHint')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                />
                <p className="mt-0.5 text-xs text-gray-500 truncate">
                  {t('admin.attributes.valueModal.priceAdjustment')}
                </p>
              </div>
              <button
                onClick={() => onAddValue(attribute.id)}
                disabled={!newValue.trim() || addingValueTo === attribute.id}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {addingValueTo === attribute.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('admin.attributes.adding')}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t('admin.attributes.add')}
                  </>
                )}
              </button>
            </div>
          </div>

          {attribute.values.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">{t('admin.attributes.noValuesYet')}</p>
          ) : (
            <div className="space-y-2">
              {attribute.values.map((value) => {
                const isValueExpanded = expandedValueId === value.id;
                return (
                  <div key={value.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2 flex-1">
                        {value.colors && value.colors.length > 0 ? (
                          <span
                            className="inline-block w-5 h-5 rounded-full border border-gray-300 flex-shrink-0"
                            style={{ backgroundColor: value.colors[0] }}
                            title={value.colors[0]}
                          />
                        ) : value.imageUrl ? (
                          <img
                            src={value.imageUrl}
                            alt={value.label}
                            className="w-5 h-5 object-cover rounded border border-gray-300 flex-shrink-0"
                          />
                        ) : null}
                        <span className="text-sm font-medium text-gray-900">{value.label}</span>
                        {(value.priceAdjustment ?? 0) !== 0 && (
                          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {value.priceAdjustment! > 0 ? '+' : ''}
                            {value.priceAdjustment}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onToggleValueEdit(attribute.id, value)}
                          className="text-gray-600 hover:text-gray-900 transition-colors"
                          title={t('admin.attributes.configureValue') || 'Configure value'}
                        >
                          <svg
                            className={`w-4 h-4 transition-transform ${isValueExpanded ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDeleteValue(attribute.id, value.id, value.label)}
                          disabled={deletingValue === value.id}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors"
                          title={t('admin.attributes.deleteValue')}
                        >
                          {deletingValue === value.id ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    {isValueExpanded && (
                      <ValueEditForm
                        attributeId={attribute.id}
                        value={value}
                        editingLabel={editingLabel}
                        editingColors={editingColors}
                        editingImageUrl={editingImageUrl}
                        editingPriceAdjustment={editingPriceAdjustment}
                        savingValue={savingValue}
                        imageUploading={imageUploading}
                        fileInputRef={fileInputRef}
                        onLabelChange={onEditingLabelChange}
                        onColorsChange={onEditingColorsChange}
                        onPriceAdjustmentChange={onEditingPriceAdjustmentChange}
                        onImageUpload={onImageUpload}
                        onRemoveImage={onRemoveImage}
                        onSave={onSaveInlineValue}
                        onCancel={() => onToggleValueEdit(attribute.id, value)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
