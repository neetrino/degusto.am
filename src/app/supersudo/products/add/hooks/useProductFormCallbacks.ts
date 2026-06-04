import { logger } from "@/lib/utils/logger";
/**
 * Hook for product form callbacks and event handlers
 */

import type { ChangeEvent } from 'react';
import type { Category, GeneratedVariant, SimpleProductData } from '../types';
import { generateSkuFromSlug, slugifyProductTitle } from '../utils/productUtils';

interface UseProductFormCallbacksProps {
  formData: {
    title: string;
    slug: string;
    primaryCategoryId: string;
  };
  categories: Category[];
  selectedAttributesForVariants: Set<string>;
  selectedAttributeValueIds: Record<string, string[]>;
  generatedVariants: GeneratedVariant[];
  setFormData: (updater: (prev: any) => any) => void;
  setSelectedAttributesForVariants: (value: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  setSelectedAttributeValueIds: (value: Record<string, string[]> | ((prev: Record<string, string[]>) => Record<string, string[]>)) => void;
  setGeneratedVariants: (value: GeneratedVariant[] | ((prev: GeneratedVariant[]) => GeneratedVariant[])) => void;
  setSimpleProductData: (
    value: SimpleProductData | ((prev: SimpleProductData) => SimpleProductData),
  ) => void;
  checkIsClothingCategory: (categoryId: string, categories: Category[]) => boolean;
  isEditMode: boolean;
}

export function useProductFormCallbacks({
  formData,
  categories,
  selectedAttributesForVariants,
  selectedAttributeValueIds,
  generatedVariants,
  setFormData,
  setSelectedAttributesForVariants,
  setSelectedAttributeValueIds,
  setGeneratedVariants,
  setSimpleProductData,
  checkIsClothingCategory,
  isEditMode,
}: UseProductFormCallbacksProps) {
  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    if (isEditMode) {
      setFormData((prev) => ({ ...prev, title }));
      return;
    }
    const slug = slugifyProductTitle(title);
    setFormData((prev) => ({
      ...prev,
      title,
      slug,
    }));
    setSimpleProductData((prev) => ({
      ...prev,
      sku: generateSkuFromSlug(slug),
    }));
  };

  const isClothingCategory = () => checkIsClothingCategory(formData.primaryCategoryId, categories);

  const handleAttributeToggle = (attributeId: string, checked: boolean) => {
    const newSet = new Set(selectedAttributesForVariants);
    if (checked) {
      newSet.add(attributeId);
    } else {
      newSet.delete(attributeId);
      const newValueIds = { ...selectedAttributeValueIds };
      delete newValueIds[attributeId];
      setSelectedAttributeValueIds(newValueIds);
    }
    setSelectedAttributesForVariants(newSet);
  };

  const handleAttributeRemove = (attributeId: string) => {
    const newSet = new Set(selectedAttributesForVariants);
    newSet.delete(attributeId);
    const newValueIds = { ...selectedAttributeValueIds };
    delete newValueIds[attributeId];
    setSelectedAttributeValueIds(newValueIds);
    setSelectedAttributesForVariants(newSet);
  };

  const handleVariantDelete = (variantId: string) => {
    setGeneratedVariants((prev) => prev.filter((v) => v.id !== variantId));
  };

  const handleVariantAdd = () => {
    const newVariant: GeneratedVariant = {
      id: `variant-${Date.now()}-${Math.random()}`,
      selectedValueIds: [],
      price: '0.00',
      compareAtPrice: '0.00',
      stock: '0',
      sku: generateSkuFromSlug(formData.slug || slugifyProductTitle(formData.title)),
      image: null,
    };
    setGeneratedVariants((prev) => {
      const updated = [...prev, newVariant];
      logger.debug('✅ [VARIANT BUILDER] New manual variant added:', {
        newVariantId: newVariant.id,
        totalVariants: updated.length,
        manualVariants: updated.filter((v) => v.id !== 'variant-all').length,
        autoVariants: updated.filter((v) => v.id === 'variant-all').length,
      });
      return updated;
    });
  };

  return {
    handleTitleChange,
    isClothingCategory,
    handleAttributeToggle,
    handleAttributeRemove,
    handleVariantDelete,
    handleVariantAdd,
  };
}

