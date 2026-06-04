import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { apiClient } from '@/lib/api-client';
import { CURRENCIES, type CurrencyCode } from '@/lib/currency';
import type { Category, Attribute } from '../types';
import { createEmptyCustomizationFormState } from '../utils/pdp-customization-form';
import type { PdpCustomizationFormState } from '../utils/pdp-customization-form';
import { logger } from "@/lib/utils/logger";

interface UseProductDataLoadingProps {
  isLoggedIn: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  setReferenceCatalogReady: (ready: boolean) => void;
  setCategories: (categories: Category[]) => void;
  setAttributes: (attributes: Attribute[]) => void;
  setDefaultCurrency: (currency: CurrencyCode) => void;
  attributesDropdownOpen: boolean;
  setAttributesDropdownOpen: (open: boolean) => void;
  attributesDropdownRef: React.RefObject<HTMLDivElement>;
  categoriesExpanded: boolean;
  setCategoriesExpanded: (expanded: boolean) => void;
  setPdpCustomizationForm: (state: PdpCustomizationFormState) => void;
  setSelectedPdpCustomizationAttributeIds: (ids: Set<string>) => void;
}

export function useProductDataLoading({
  isLoggedIn,
  isAdmin,
  isLoading,
  setReferenceCatalogReady,
  setCategories,
  setAttributes,
  setDefaultCurrency,
  attributesDropdownOpen,
  setAttributesDropdownOpen,
  attributesDropdownRef,
  categoriesExpanded,
  setCategoriesExpanded,
  setPdpCustomizationForm,
  setSelectedPdpCustomizationAttributeIds,
}: UseProductDataLoadingProps) {
  const router = useRouter();

  // Auth check
  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn || !isAdmin) {
        router.push('/supersudo');
        return;
      }
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

  // Close attributes dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (attributesDropdownRef.current && !attributesDropdownRef.current.contains(event.target as Node)) {
        setAttributesDropdownOpen(false);
      }
    };

    if (attributesDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [attributesDropdownOpen, attributesDropdownRef, setAttributesDropdownOpen]);

  // Fetch settings (currency), categories and attributes together so edit load runs once with correct currency
  useEffect(() => {
    const fetchData = async () => {
      try {
        logger.debug('📥 [ADMIN] Fetching settings, categories, and attributes...');
        const [settingsRes, categoriesRes, attributesRes] = await Promise.all([
          apiClient.get<{ defaultCurrency?: string }>('/api/v1/admin/settings'),
          apiClient.get<{ data: Category[] }>('/api/v1/admin/categories'),
          apiClient.get<{ data: Attribute[] }>('/api/v1/admin/attributes'),
        ]);
        const currency = (settingsRes.defaultCurrency || 'AMD') as CurrencyCode;
        if (currency in CURRENCIES) {
          setDefaultCurrency(currency);
          logger.debug('✅ [ADMIN] Default currency loaded:', currency);
        } else {
          setDefaultCurrency('AMD');
        }
        setCategories(categoriesRes.data || []);
        const loadedAttributes = attributesRes.data || [];
        setAttributes(loadedAttributes);
        setPdpCustomizationForm(createEmptyCustomizationFormState());
        setSelectedPdpCustomizationAttributeIds(new Set());
        logger.debug('✅ [ADMIN] Data fetched:', {
          categories: categoriesRes.data?.length || 0,
          attributes: attributesRes.data?.length || 0,
        });
        // Debug: Log attributes details
        if (attributesRes.data && attributesRes.data.length > 0) {
          logger.debug('📋 [ADMIN] Attributes loaded:', attributesRes.data.map(attr => ({
            id: attr.id,
            key: attr.key,
            name: attr.name,
            valuesCount: attr.values?.length || 0,
            values: attr.values?.map(v => ({ 
              value: v.value, 
              label: v.label,
              colors: v.colors,
              colorsType: typeof v.colors,
              colorsIsArray: Array.isArray(v.colors),
              colorsLength: v.colors?.length,
              imageUrl: v.imageUrl 
            })) || []
          })));
          const colorAttr = attributesRes.data.find(a => a.key === 'color');
          const sizeAttr = attributesRes.data.find(a => a.key === 'size');
          if (!colorAttr) {
            console.warn('⚠️ [ADMIN] Color attribute not found in loaded attributes!');
          } else {
            logger.debug('✅ [ADMIN] Color attribute found:', { id: colorAttr.id, valuesCount: colorAttr.values?.length || 0 });
          }
          if (!sizeAttr) {
            console.warn('⚠️ [ADMIN] Size attribute not found in loaded attributes!');
          } else {
            logger.debug('✅ [ADMIN] Size attribute found:', { id: sizeAttr.id, valuesCount: sizeAttr.values?.length || 0 });
          }
        } else {
          console.warn('⚠️ [ADMIN] No attributes loaded! This may cause issues with variant builder.');
        }
        // Debug: Log categories with requiresSizes
        if (categoriesRes.data) {
          logger.debug('📋 [ADMIN] Categories with requiresSizes:', 
            categoriesRes.data.map(cat => ({ 
              id: cat.id, 
              title: cat.title, 
              requiresSizes: cat.requiresSizes 
            }))
          );
        }
      } catch (err: any) {
        console.error('❌ [ADMIN] Error fetching data:', err);
        setDefaultCurrency('AMD');
      } finally {
        setReferenceCatalogReady(true);
      }
    };
    fetchData();
  }, [setCategories, setAttributes, setReferenceCatalogReady, setDefaultCurrency]);

  // Close category dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (categoriesExpanded && !target.closest('[data-category-dropdown]')) {
        setCategoriesExpanded(false);
      }
    };

    if (categoriesExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [categoriesExpanded, setCategoriesExpanded]);

}


