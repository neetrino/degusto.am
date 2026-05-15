'use client';

import { Card } from '@shop/ui';
import { useTranslation } from '../../../lib/i18n-client';
import { GlobalDiscountCard } from './components/GlobalDiscountCard';
import { QuickInfoCard } from './components/QuickInfoCard';
import { CategoryDiscountsCard } from './components/CategoryDiscountsCard';
import { BrandDiscountsCard } from './components/BrandDiscountsCard';
import { ProductDiscountsCard } from './components/ProductDiscountsCard';

interface AdminCategory {
  id: string;
  title: string;
  parentId: string | null;
}

interface AdminBrand {
  id: string;
  name: string;
  logoUrl?: string;
}

interface AdminProduct {
  id: string;
  title: string;
  image?: string;
  price?: number;
  discountPercent?: number;
}

interface QuickSettingsContentProps {
  globalDiscount: number;
  setGlobalDiscount: (value: number) => void;
  discountLoading: boolean;
  discountSaving: boolean;
  handleDiscountSave: () => void;
  categories: AdminCategory[];
  categoriesLoading: boolean;
  categoryDiscounts: Record<string, number>;
  updateCategoryDiscountValue: (categoryId: string, value: string) => void;
  clearCategoryDiscount: (categoryId: string) => void;
  handleCategoryDiscountSave: () => void;
  categorySaving: boolean;
  brands: AdminBrand[];
  brandsLoading: boolean;
  brandDiscounts: Record<string, number>;
  updateBrandDiscountValue: (brandId: string, value: string) => void;
  clearBrandDiscount: (brandId: string) => void;
  handleBrandDiscountSave: () => void;
  brandSaving: boolean;
  products: AdminProduct[];
  productsLoading: boolean;
  productsPage: number;
  productsTotalPages: number;
  productsTotal: number;
  productsSearch: string;
  onProductsSearchChange: (value: string) => void;
  onProductsPageChange: (page: number) => void;
  productDiscounts: Record<string, number>;
  setProductDiscounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  handleProductDiscountSave: (productId: string) => void;
  savingProductId: string | null;
}

export function QuickSettingsContent({
  globalDiscount,
  setGlobalDiscount,
  discountLoading,
  discountSaving,
  handleDiscountSave,
  categories,
  categoriesLoading,
  categoryDiscounts,
  updateCategoryDiscountValue,
  clearCategoryDiscount,
  handleCategoryDiscountSave,
  categorySaving,
  brands,
  brandsLoading,
  brandDiscounts,
  updateBrandDiscountValue,
  clearBrandDiscount,
  handleBrandDiscountSave,
  brandSaving,
  products,
  productsLoading,
  productsPage,
  productsTotalPages,
  productsTotal,
  productsSearch,
  onProductsSearchChange,
  onProductsPageChange,
  productDiscounts,
  setProductDiscounts,
  handleProductDiscountSave,
  savingProductId,
}: QuickSettingsContentProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="mb-8">
        <p className="text-gray-600">{t('admin.quickSettings.subtitle')}</p>
      </div>

      <Card className="mb-8 border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{t('admin.quickSettings.quickSettingsTitle')}</h2>
            <p className="mt-1 text-sm text-gray-600">{t('admin.quickSettings.quickSettingsSubtitle')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <GlobalDiscountCard
            globalDiscount={globalDiscount}
            setGlobalDiscount={setGlobalDiscount}
            discountLoading={discountLoading}
            discountSaving={discountSaving}
            handleDiscountSave={handleDiscountSave}
          />

          <QuickInfoCard />
        </div>
      </Card>

      <CategoryDiscountsCard
        categories={categories}
        categoriesLoading={categoriesLoading}
        categoryDiscounts={categoryDiscounts}
        updateCategoryDiscountValue={updateCategoryDiscountValue}
        clearCategoryDiscount={clearCategoryDiscount}
        handleCategoryDiscountSave={handleCategoryDiscountSave}
        categorySaving={categorySaving}
      />

      <BrandDiscountsCard
        brands={brands}
        brandsLoading={brandsLoading}
        brandDiscounts={brandDiscounts}
        updateBrandDiscountValue={updateBrandDiscountValue}
        clearBrandDiscount={clearBrandDiscount}
        handleBrandDiscountSave={handleBrandDiscountSave}
        brandSaving={brandSaving}
      />

      <ProductDiscountsCard
        products={products}
        productsLoading={productsLoading}
        productsPage={productsPage}
        productsTotalPages={productsTotalPages}
        productsTotal={productsTotal}
        productsSearch={productsSearch}
        onProductsSearchChange={onProductsSearchChange}
        onProductsPageChange={onProductsPageChange}
        productDiscounts={productDiscounts}
        setProductDiscounts={setProductDiscounts}
        handleProductDiscountSave={handleProductDiscountSave}
        savingProductId={savingProductId}
      />
    </>
  );
}
