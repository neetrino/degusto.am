'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthContext';
import { apiClient } from '../../../lib/api-client';
import { useTranslation } from '../../../lib/i18n-client';
import { QuickSettingsContent } from './QuickSettingsContent';
import { logger } from "@/lib/utils/logger";

interface AdminSettingsResponse {
  globalDiscount: number;
  categoryDiscounts?: Record<string, number>;
  brandDiscounts?: Record<string, number>;
}

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

interface AdminProductsResponse {
  data: AdminProduct[];
  meta?: {
    totalPages?: number;
    total?: number;
  };
}

const PRODUCTS_PAGE_LIMIT = 20;

export default function QuickSettingsPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountSaving, setDiscountSaving] = useState(false);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productDiscounts, setProductDiscounts] = useState<Record<string, number>>({});
  const [savingProductId, setSavingProductId] = useState<string | null>(null);
  const [productsPage, setProductsPage] = useState(1);
  const [productsTotalPages, setProductsTotalPages] = useState(1);
  const [productsTotal, setProductsTotal] = useState(0);
  const [productsSearch, setProductsSearch] = useState('');
  const [categoryDiscounts, setCategoryDiscounts] = useState<Record<string, number>>({});
  const [brandDiscounts, setBrandDiscounts] = useState<Record<string, number>>({});
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [categorySaving, setCategorySaving] = useState(false);
  const [brandSaving, setBrandSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      logger.debug('⚙️ [QUICK SETTINGS] Fetching settings...');
      setDiscountLoading(true);
      const settings = await apiClient.get<AdminSettingsResponse>('/api/v1/admin/settings');
      setGlobalDiscount(settings.globalDiscount || 0);
      setCategoryDiscounts(settings.categoryDiscounts || {});
      setBrandDiscounts(settings.brandDiscounts || {});
      logger.debug('✅ [QUICK SETTINGS] Settings loaded:', settings);
    } catch (err: any) {
      console.error('❌ [QUICK SETTINGS] Error fetching settings:', err);
      setGlobalDiscount(0);
    } finally {
      setDiscountLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async (page: number, search: string) => {
    try {
      logger.debug('📦 [QUICK SETTINGS] Fetching products...');
      setProductsLoading(true);
      const normalizedSearch = search.trim();

      const response = await apiClient.get<AdminProductsResponse>('/api/v1/admin/products', {
        params: {
          page: page.toString(),
          limit: PRODUCTS_PAGE_LIMIT.toString(),
          ...(normalizedSearch ? { search: normalizedSearch } : {}),
        },
      });

      if (response?.data && Array.isArray(response.data)) {
        const safeTotalPages = Math.max(1, response.meta?.totalPages || 1);
        const safePage = Math.min(page, safeTotalPages);

        setProducts(response.data);
        setProductsTotal(response.meta?.total || 0);
        setProductsTotalPages(safeTotalPages);

        if (safePage !== page) {
          setProductsPage(safePage);
        }

        setProductDiscounts((prev) => {
          const updated = { ...prev };
          response.data.forEach((product) => {
            updated[product.id] = product.discountPercent || 0;
          });
          return updated;
        });

        logger.debug('✅ [QUICK SETTINGS] Products page loaded:', {
          page: safePage,
          count: response.data.length,
          total: response.meta?.total || 0,
          search: normalizedSearch,
        });
      } else {
        setProducts([]);
        setProductsTotal(0);
        setProductsTotalPages(1);
        console.warn('⚠️ [QUICK SETTINGS] No products data received');
      }
    } catch (err: unknown) {
      console.error('❌ [QUICK SETTINGS] Error fetching products:', err);
      setProducts([]);
      setProductsTotal(0);
      setProductsTotalPages(1);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      logger.debug('📂 [QUICK SETTINGS] Fetching categories...');
      setCategoriesLoading(true);
      const response = await apiClient.get<{ data: AdminCategory[] }>('/api/v1/admin/categories');
      if (response?.data && Array.isArray(response.data)) {
        setCategories(response.data);
        logger.debug('✅ [QUICK SETTINGS] Categories loaded:', response.data.length);
      } else {
        setCategories([]);
      }
    } catch (err: any) {
      console.error('❌ [QUICK SETTINGS] Error fetching categories:', err);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const fetchBrands = useCallback(async () => {
    try {
      logger.debug('🏷️ [QUICK SETTINGS] Fetching brands...');
      setBrandsLoading(true);
      const response = await apiClient.get<{ data: AdminBrand[] }>('/api/v1/admin/brands');
      if (response?.data && Array.isArray(response.data)) {
        setBrands(response.data);
        logger.debug('✅ [QUICK SETTINGS] Brands loaded:', response.data.length);
      } else {
        setBrands([]);
      }
    } catch (err: any) {
      console.error('❌ [QUICK SETTINGS] Error fetching brands:', err);
      setBrands([]);
    } finally {
      setBrandsLoading(false);
    }
  }, []);

  const clampDiscountValue = (value: number) => {
    if (isNaN(value)) {
      return 0;
    }
    return Math.min(100, Math.max(0, Math.round(value * 100) / 100));
  };

  const updateCategoryDiscountValue = (categoryId: string, value: string) => {
    if (value === '') {
      setCategoryDiscounts((prev) => {
        const updated = { ...prev };
        delete updated[categoryId];
        return updated;
      });
      return;
    }
    const numericValue = clampDiscountValue(parseFloat(value));
    setCategoryDiscounts((prev) => ({
      ...prev,
      [categoryId]: numericValue,
    }));
  };

  const updateBrandDiscountValue = (brandId: string, value: string) => {
    if (value === '') {
      setBrandDiscounts((prev) => {
        const updated = { ...prev };
        delete updated[brandId];
        return updated;
      });
      return;
    }
    const numericValue = clampDiscountValue(parseFloat(value));
    setBrandDiscounts((prev) => ({
      ...prev,
      [brandId]: numericValue,
    }));
  };

  const clearCategoryDiscount = (categoryId: string) => {
    setCategoryDiscounts((prev) => {
      const updated = { ...prev };
      delete updated[categoryId];
      return updated;
    });
  };

  const clearBrandDiscount = (brandId: string) => {
    setBrandDiscounts((prev) => {
      const updated = { ...prev };
      delete updated[brandId];
      return updated;
    });
  };

  const buildDiscountPayload = () => {
    const filterMap = (map: Record<string, number>) =>
      Object.entries(map || {}).reduce<Record<string, number>>((acc, [id, value]) => {
        if (typeof value === 'number' && value > 0) {
          acc[id] = clampDiscountValue(value);
        }
        return acc;
      }, {});

    return {
      categoryDiscounts: filterMap(categoryDiscounts),
      brandDiscounts: filterMap(brandDiscounts),
    };
  };

  const handleDiscountSave = async () => {
    const discountValue = parseFloat(globalDiscount.toString());
    if (isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
      alert(t('admin.quickSettings.discountMustBeValid'));
      return;
    }

    setDiscountSaving(true);
    try {
      logger.debug('⚙️ [QUICK SETTINGS] Saving global discount...', discountValue);
      await apiClient.put('/api/v1/admin/settings', {
        globalDiscount: discountValue,
        ...buildDiscountPayload(),
      });
      
      // Refresh products to get updated labels with new discount percentage
      await fetchProducts(productsPage, productsSearch);
      
      alert(t('admin.quickSettings.savedSuccess'));
      logger.debug('✅ [QUICK SETTINGS] Global discount saved');
    } catch (err: any) {
      console.error('❌ [QUICK SETTINGS] Error saving discount:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to save';
      alert(t('admin.quickSettings.errorSaving').replace('{message}', errorMessage));
    } finally {
      setDiscountSaving(false);
    }
  };

  const handleCategoryDiscountSave = async () => {
    setCategorySaving(true);
    try {
      logger.debug('⚙️ [QUICK SETTINGS] Saving category discounts...');
      await apiClient.put('/api/v1/admin/settings', {
        globalDiscount,
        ...buildDiscountPayload(),
      });
      await fetchProducts(productsPage, productsSearch);
      alert(t('admin.quickSettings.savedSuccess'));
      logger.debug('✅ [QUICK SETTINGS] Category discounts saved');
    } catch (err: any) {
      console.error('❌ [QUICK SETTINGS] Error saving category discounts:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to save';
      alert(t('admin.quickSettings.errorSaving').replace('{message}', errorMessage));
    } finally {
      setCategorySaving(false);
    }
  };

  const handleBrandDiscountSave = async () => {
    setBrandSaving(true);
    try {
      logger.debug('⚙️ [QUICK SETTINGS] Saving brand discounts...');
      await apiClient.put('/api/v1/admin/settings', {
        globalDiscount,
        ...buildDiscountPayload(),
      });
      await fetchProducts(productsPage, productsSearch);
      alert(t('admin.quickSettings.savedSuccess'));
      logger.debug('✅ [QUICK SETTINGS] Brand discounts saved');
    } catch (err: any) {
      console.error('❌ [QUICK SETTINGS] Error saving brand discounts:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to save';
      alert(t('admin.quickSettings.errorSaving').replace('{message}', errorMessage));
    } finally {
      setBrandSaving(false);
    }
  };

  const handleProductDiscountSave = async (productId: string) => {
    const discountValue = productDiscounts[productId] || 0;
    if (isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
      alert(t('admin.quickSettings.discountMustBeValid'));
      return;
    }

    setSavingProductId(productId);
    try {
      logger.debug('⚙️ [QUICK SETTINGS] Saving product discount only...', productId, discountValue);
      
      // Используем специальный endpoint, который обновляет только discountPercent
      // Это гарантирует, что все остальные поля (media, variants, price и т.д.) останутся без изменений
      const updateData = {
        discountPercent: discountValue,
      };
      
      logger.debug('📤 [QUICK SETTINGS] Sending update data to discount endpoint:', updateData);
      
      await apiClient.patch(`/api/v1/admin/products/${productId}/discount`, updateData);
      
      // Refresh products to get updated labels with new discount percentage
      await fetchProducts(productsPage, productsSearch);
      
      alert(t('admin.quickSettings.productDiscountSaved'));
      logger.debug('✅ [QUICK SETTINGS] Product discount saved');
    } catch (err: any) {
      console.error('❌ [QUICK SETTINGS] Error saving product discount:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to save';
      alert(t('admin.quickSettings.errorSavingProduct').replace('{message}', errorMessage));
    } finally {
      setSavingProductId(null);
    }
  };

  useEffect(() => {
    if (!isLoading && isLoggedIn && isAdmin) {
      fetchSettings();
      fetchCategories();
      fetchBrands();
    }
  }, [isLoading, isLoggedIn, isAdmin, fetchSettings, fetchCategories, fetchBrands]);

  useEffect(() => {
    if (!isLoading && isLoggedIn && isAdmin) {
      fetchProducts(productsPage, productsSearch);
    }
  }, [isLoading, isLoggedIn, isAdmin, productsPage, productsSearch, fetchProducts]);

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn) {
        logger.debug('❌ [QUICK SETTINGS] User not logged in, redirecting to login...');
        router.push('/login');
        return;
      }
      if (!isAdmin) {
        logger.debug('❌ [QUICK SETTINGS] User is not admin, redirecting to home...');
        router.push('/');
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
    return null; // Will redirect
  }

  return (
    <QuickSettingsContent
      globalDiscount={globalDiscount}
      setGlobalDiscount={setGlobalDiscount}
      discountLoading={discountLoading}
      discountSaving={discountSaving}
      handleDiscountSave={handleDiscountSave}
      categories={categories}
      categoriesLoading={categoriesLoading}
      categoryDiscounts={categoryDiscounts}
      updateCategoryDiscountValue={updateCategoryDiscountValue}
      clearCategoryDiscount={clearCategoryDiscount}
      handleCategoryDiscountSave={handleCategoryDiscountSave}
      categorySaving={categorySaving}
      brands={brands}
      brandsLoading={brandsLoading}
      brandDiscounts={brandDiscounts}
      updateBrandDiscountValue={updateBrandDiscountValue}
      clearBrandDiscount={clearBrandDiscount}
      handleBrandDiscountSave={handleBrandDiscountSave}
      brandSaving={brandSaving}
      products={products}
      productsLoading={productsLoading}
      productsPage={productsPage}
      productsTotalPages={productsTotalPages}
      productsTotal={productsTotal}
      productsSearch={productsSearch}
      onProductsSearchChange={(value) => {
        setProductsPage(1);
        setProductsSearch(value);
      }}
      onProductsPageChange={setProductsPage}
      productDiscounts={productDiscounts}
      setProductDiscounts={setProductDiscounts}
      handleProductDiscountSave={handleProductDiscountSave}
      savingProductId={savingProductId}
    />
  );
}
