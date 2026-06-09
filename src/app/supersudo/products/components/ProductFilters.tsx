'use client';

import type { FormEvent } from 'react';
import { useTranslation } from '../../../../lib/i18n-client';
import type { Category } from '../types';

interface ProductFiltersProps {
  search: string;
  setSearch: (search: string) => void;
  skuSearch: string;
  setSkuSearch: (sku: string) => void;
  selectedCategories: Set<string>;
  setSelectedCategories: (categories: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  categories: Category[];
  categoriesLoading: boolean;
  categoriesExpanded: boolean;
  setCategoriesExpanded: (expanded: boolean) => void;
  stockFilter: 'all' | 'inStock' | 'outOfStock';
  setStockFilter: (filter: 'all' | 'inStock' | 'outOfStock') => void;
  minPrice: string;
  setMinPrice: (price: string) => void;
  maxPrice: string;
  setMaxPrice: (price: string) => void;
  handleSearch: (e: FormEvent) => void;
  setPage: (page: number | ((prev: number) => number)) => void;
}

export function ProductFilters({
  search,
  setSearch,
  skuSearch,
  setSkuSearch,
  selectedCategories,
  setSelectedCategories,
  categories,
  categoriesLoading,
  categoriesExpanded,
  setCategoriesExpanded,
  stockFilter,
  setStockFilter,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  handleSearch,
  setPage,
}: ProductFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-6 space-y-4 rounded-2xl border border-[#dfe6e0] bg-white p-4 shadow-[0_5px_14px_rgba(22,45,32,0.05)]">
      {/* Search Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#3f5648]">
            {t('admin.products.searchByTitleOrSlug')}
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch(e as any);
              }
            }}
            placeholder={t('admin.products.searchPlaceholder')}
            className="w-full rounded-xl border border-[#dce3dd] bg-[#fcfdfc] px-4 py-2.5 text-sm text-[#314f3f] shadow-sm focus:border-[#1f6c4b] focus:outline-none focus:ring-2 focus:ring-[#1f6c4b]/20"
          />
        </div>
        
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#3f5648]">
            {t('admin.products.searchBySku')}
          </label>
          <input
            type="text"
            value={skuSearch}
            onChange={(e) => {
              setSkuSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t('admin.products.skuPlaceholder')}
            className="w-full rounded-xl border border-[#dce3dd] bg-[#fcfdfc] px-4 py-2.5 text-sm text-[#314f3f] shadow-sm focus:border-[#1f6c4b] focus:outline-none focus:ring-2 focus:ring-[#1f6c4b]/20"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Category Filter */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#3f5648]">
            {t('admin.products.filterByCategory')}
          </label>
          <div className="relative z-[120]" data-category-dropdown>
            <button
              type="button"
              onClick={() => setCategoriesExpanded(!categoriesExpanded)}
              className="flex w-full items-center justify-between rounded-xl border border-[#dce3dd] bg-[#fcfdfc] px-4 py-2.5 text-left text-sm shadow-sm focus:border-[#1f6c4b] focus:outline-none focus:ring-2 focus:ring-[#1f6c4b]/20"
            >
              <span className="text-[#3f5648]">
                {selectedCategories.size === 0
                  ? t('admin.products.allCategories')
                  : selectedCategories.size === 1
                  ? categories.find(c => selectedCategories.has(c.id))?.title || '1 category'
                  : `${selectedCategories.size} categories`}
              </span>
              <svg
                className={`h-4 w-4 text-[#6f7e75] transition-transform duration-200 ${
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
              <div className="absolute z-[130] mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-[#dce3dd] bg-white shadow-2xl">
                {categoriesLoading ? (
                  <div className="p-3 text-sm text-gray-500 text-center">{t('admin.products.loadingCategories')}</div>
                ) : categories.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500 text-center">{t('admin.products.noCategoriesAvailable')}</div>
                ) : (
                  <div className="p-2">
                    <div className="space-y-1">
                      {categories.map((category) => (
                        <label
                          key={category.id}
                          className="flex cursor-pointer items-center space-x-2 rounded-lg p-2 hover:bg-[#f2f7f3]"
                        >
                          <input
                            type="checkbox"
                            checked={selectedCategories.has(category.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedCategories);
                              if (e.target.checked) {
                                newSelected.add(category.id);
                              } else {
                                newSelected.delete(category.id);
                              }
                              setSelectedCategories(newSelected);
                              setPage(1);
                            }}
                            className="h-4 w-4 rounded border-[#b9c8bd] text-[#1f6c4b] focus:ring-[#1f6c4b]/20"
                          />
                          <span className="text-sm text-[#3f5648]">{category.title}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Stock Filter */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#3f5648]">
            {t('admin.products.filterByStock')}
          </label>
          <select
            value={stockFilter}
            onChange={(e) => {
              setStockFilter(e.target.value as 'all' | 'inStock' | 'outOfStock');
              setPage(1);
            }}
            className="w-full rounded-xl border border-[#dce3dd] bg-[#fcfdfc] px-4 py-2.5 text-sm text-[#314f3f] shadow-sm focus:border-[#1f6c4b] focus:outline-none focus:ring-2 focus:ring-[#1f6c4b]/20"
          >
            <option value="all">{t('admin.products.allProducts')}</option>
            <option value="inStock">{t('admin.products.inStock')}</option>
            <option value="outOfStock">{t('admin.products.outOfStock')}</option>
          </select>
        </div>
      </div>
    </div>
  );
}






