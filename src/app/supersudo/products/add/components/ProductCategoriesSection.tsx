'use client';

import { useMemo } from 'react';
import { Input } from '@shop/ui';
import { useTranslation } from '../../../../../lib/i18n-client';
import { buildCategoryTree } from '../../../categories/utils';
import type { Category, Variant } from '../types';

const CATEGORY_LEVEL_PADDING_CLASSES = ['pl-2', 'pl-6', 'pl-10', 'pl-14', 'pl-[4.5rem]'] as const;

interface ProductCategoriesSectionProps {
  categories: Category[];
  categoryIds: string[];
  categoriesExpanded: boolean;
  useNewCategory: boolean;
  newCategoryName: string;
  onCategoriesExpandedChange: (expanded: boolean) => void;
  onUseNewCategoryChange: (useNew: boolean) => void;
  onNewCategoryNameChange: (name: string) => void;
  onCategoryIdsChange: (ids: string[]) => void;
  onPrimaryCategoryIdChange: (id: string) => void;
  isClothingCategory: () => boolean;
  onVariantsUpdate?: (updater: (prev: Variant[]) => Variant[]) => void;
}

export function ProductCategoriesSection({
  categories,
  categoryIds,
  categoriesExpanded,
  useNewCategory,
  newCategoryName,
  onCategoriesExpandedChange,
  onUseNewCategoryChange,
  onNewCategoryNameChange,
  onCategoryIdsChange,
  onPrimaryCategoryIdChange,
  isClothingCategory,
  onVariantsUpdate,
}: ProductCategoriesSectionProps) {
  const { t } = useTranslation();

  const displayCategories = useMemo(() => buildCategoryTree(categories), [categories]);

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    const newCategoryIds = checked
      ? [...categoryIds, categoryId]
      : categoryIds.filter((id) => id !== categoryId);

    const newPrimaryCategoryId = newCategoryIds.length > 0 ? newCategoryIds[0] : '';

    const selectedCategory = categories.find((cat) => cat.id === categoryId);
    const newIsSizeRequired = selectedCategory?.requiresSizes ?? false;

    onCategoryIdsChange(newCategoryIds);
    onPrimaryCategoryIdChange(newPrimaryCategoryId);

    if (onVariantsUpdate) {
      const wasSizeRequired = isClothingCategory();
      if (wasSizeRequired && !newIsSizeRequired && newCategoryIds.length === 0) {
        onVariantsUpdate((prev) =>
          prev.map((v) => ({
            ...v,
            sizes: [],
            sizeStocks: {},
            size: '',
          }))
        );
      }
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('admin.products.add.categories')}</h2>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('admin.products.add.categories')}{' '}
            <span className="text-gray-500 font-normal">{t('admin.products.add.selectMultiple')}</span>
          </label>
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="radio"
                id="select-category"
                name="category-mode"
                checked={!useNewCategory}
                onChange={() => {
                  onUseNewCategoryChange(false);
                  onNewCategoryNameChange('');
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="select-category" className="text-sm text-gray-700">
                {t('admin.products.add.selectExistingCategories')}
              </label>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="radio"
                id="new-category"
                name="category-mode"
                checked={useNewCategory}
                onChange={() => {
                  onUseNewCategoryChange(true);
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="new-category" className="text-sm text-gray-700">
                {t('admin.products.add.addNewCategory')}
              </label>
            </div>
            {!useNewCategory ? (
              <div className="relative" data-category-dropdown>
                <button
                  type="button"
                  onClick={() => onCategoriesExpandedChange(!categoriesExpanded)}
                  className="w-full px-3 py-2 text-left border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm flex items-center justify-between"
                >
                  <span className="text-gray-700">
                    {categoryIds.length === 0
                      ? t('admin.products.add.selectCategories')
                      : categoryIds.length === 1
                        ? t('admin.products.add.categorySelected').replace('{count}', categoryIds.length.toString())
                        : t('admin.products.add.categoriesSelected').replace('{count}', categoryIds.length.toString())}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                      categoriesExpanded ? 'transform rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {categoriesExpanded && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2">
                      <div className="space-y-1">
                        {displayCategories.length === 0 ? (
                          <p className="text-sm text-gray-500 p-2">{t('admin.products.noCategoriesAvailable')}</p>
                        ) : (
                          displayCategories.map((category) => {
                            const paddingClass =
                              CATEGORY_LEVEL_PADDING_CLASSES[
                                Math.min(category.level, CATEGORY_LEVEL_PADDING_CLASSES.length - 1)
                              ];
                            const isSubcategory = category.level > 0;

                            return (
                          <label
                            key={category.id}
                            className={`flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded ${paddingClass}`}
                          >
                            <input
                              type="checkbox"
                              checked={categoryIds.includes(category.id)}
                              onChange={(e) => handleCategoryChange(category.id, e.target.checked)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span
                              className={`text-gray-700 ${
                                isSubcategory ? 'text-xs' : 'text-sm font-semibold'
                              }`}
                            >
                              {category.title}
                            </span>
                          </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <Input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => onNewCategoryNameChange(e.target.value)}
                  placeholder={t('admin.products.add.enterNewCategoryName')}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
