import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import type { CurrencyCode } from '@/lib/currency';
import type { Attribute, Category, Variant, GeneratedVariant, SimpleProductData } from '../types';
import { useCategoryCreation } from './useCategoryCreation';
import { useVariantConversionToFormData } from './useVariantConversionToFormData';
import { useVariantValidation } from './useVariantValidation';
import { processImagesForSubmit } from './useImageProcessingForSubmit';
import { createAndSubmitPayload } from './useProductPayloadCreation';
import { buildVariantsForProductSubmit } from './buildVariantsForProductSubmit';
import { logger } from '@/lib/utils/logger';
import { serializePdpCustomizationConfig } from '@/lib/products/pdp-customization-config';
import type { PdpCustomizationFormState } from '../utils/pdp-customization-form';
import {
  buildDefaultVariantOptions,
  buildPdpCustomizationItems,
  collectCustomizationAttributeIds,
  mergeDefaultOptionsIntoVariants,
  collectAttributeValuePricePatches,
} from '../utils/pdp-customization-form';
import { syncAttributeValuePricePatches } from '../utils/sync-attribute-value-prices';
import { shouldSubmitAsSimpleProduct } from '../utils/product-submit-mode';
import { resolveProductSlug } from '../utils/productUtils';
import type { ProductAddFormData } from '../utils/productFormDataBuilder';
import { sanitizeVariantForCreate } from '../utils/sanitize-admin-variant';
import { ApiError } from '@/lib/api-client/types';
import { useTranslation } from '@/lib/i18n-client';
import {
  productFormSupportsFoodTasteBadges,
  resolveFoodTasteFlagsForSave,
  type FoodTasteBadgeSelection,
} from '@/lib/product-food-taste-admin';

interface UseProductFormHandlersProps {
  formData: ProductAddFormData;
  setFormData: Dispatch<SetStateAction<ProductAddFormData>>;
  setLoading: (loading: boolean) => void;
  setCategories: (updater: (prev: Category[]) => Category[]) => void;
  productType: 'simple' | 'variable';
  simpleProductData: SimpleProductData;
  selectedAttributesForVariants: Set<string>;
  generatedVariants: GeneratedVariant[];
  attributes: Attribute[];
  defaultCurrency: CurrencyCode;
  useNewCategory: boolean;
  newCategoryName: string;
  isEditMode: boolean;
  productId: string | null;
  getColorAttribute: () => Attribute | undefined;
  getSizeAttribute: () => Attribute | undefined;
  isClothingCategory: () => boolean;
  pdpCustomizationForm: PdpCustomizationFormState;
  selectedPdpCustomizationAttributeIds: Set<string>;
  hasVariantsToLoad: boolean;
  foodTasteBadges: FoodTasteBadgeSelection;
  categories: Category[];
}

export function useProductFormHandlers({
  formData,
  setFormData,
  setLoading,
  setCategories,
  productType,
  simpleProductData,
  selectedAttributesForVariants,
  generatedVariants,
  attributes,
  defaultCurrency,
  useNewCategory,
  newCategoryName,
  isEditMode,
  productId,
  getColorAttribute,
  getSizeAttribute,
  isClothingCategory,
  pdpCustomizationForm,
  selectedPdpCustomizationAttributeIds,
  hasVariantsToLoad,
  foodTasteBadges,
  categories,
}: UseProductFormHandlersProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const { createCategoryIfNeeded } = useCategoryCreation({
    formData,
    useNewCategory,
    newCategoryName,
    setCategories,
    setLoading,
  });

  const { convertGeneratedVariantsToFormData } = useVariantConversionToFormData({
    productType,
    selectedAttributesForVariants,
    generatedVariants,
    attributes,
    formDataSlug: formData.slug,
    setFormData,
  });

  const { validateVariants } = useVariantValidation({
    variants: formData.variants,
    simpleProductData,
    setLoading,
    t,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      logger.debug('📝 [ADMIN] Submitting product form:', formData);

      const categoryResult = await createCategoryIfNeeded();
      if (categoryResult.error) {
        return;
      }
      const { finalPrimaryCategoryId, creationMessages } = categoryResult;

      convertGeneratedVariantsToFormData();

      const currentFormData = formData.variants.length > 0 ? formData : { ...formData, variants: [] };
      const resolvedSlug = resolveProductSlug(currentFormData.title, currentFormData.slug);
      const formDataForSubmit = { ...currentFormData, slug: resolvedSlug };

      const submitAsSimple = shouldSubmitAsSimpleProduct({
        productType,
        formVariantsLength: currentFormData.variants.length,
        generatedVariantsLength: generatedVariants.length,
        hasVariantsToLoad,
      });

      if (!validateVariants(submitAsSimple)) {
        return;
      }

      const variants = buildVariantsForProductSubmit({
        submitAsSimple,
        simpleProductData,
        defaultCurrency,
        resolvedSlug,
        generatedVariants,
        formVariants: currentFormData.variants,
        attributes,
      });

      if (!submitAsSimple && variants.length === 0) {
        logger.error('[ADMIN] Refusing save: variable product would persist zero variants (data loss).');
        alert(t('admin.products.add.variableVariantsRequired'));
        setLoading(false);
        return;
      }

      const attributeIdsSet = new Set<string>();
      const colorAttribute = getColorAttribute();
      const sizeAttribute = getSizeAttribute();
      if (colorAttribute) {
        attributeIdsSet.add(colorAttribute.id);
      }
      if (sizeAttribute) {
        attributeIdsSet.add(sizeAttribute.id);
      }
      selectedAttributesForVariants.forEach((attributeId) => {
        attributeIdsSet.add(attributeId);
      });
      collectCustomizationAttributeIds(
        pdpCustomizationForm,
        attributes,
        selectedPdpCustomizationAttributeIds,
      ).forEach((id) => {
        attributeIdsSet.add(id);
      });

      const tasteCategoryEligible = productFormSupportsFoodTasteBadges(
        formData.categoryIds,
        isClothingCategory(),
      );
      const foodTasteFlags = resolveFoodTasteFlagsForSave(foodTasteBadges, tasteCategoryEligible);

      const attributeIds = Array.from(attributeIdsSet);

      const pricePatches = collectAttributeValuePricePatches(
        pdpCustomizationForm,
        attributes,
        selectedPdpCustomizationAttributeIds,
      );
      if (pricePatches.length > 0) {
        await syncAttributeValuePricePatches(pricePatches);
      }

      const { finalMedia, mainImage, processedVariants } = processImagesForSubmit({
        imageUrls: currentFormData.imageUrls,
        featuredImageIndex: currentFormData.featuredImageIndex,
        mainProductImage: currentFormData.mainProductImage,
        variants,
      });
      const finalVariants = processedVariants.length > 0 ? processedVariants : variants;

      const defaultCustomizationOptions = buildDefaultVariantOptions(
        pdpCustomizationForm,
        attributes,
        selectedPdpCustomizationAttributeIds,
      );
      const finalVariantsWithCustomization = mergeDefaultOptionsIntoVariants(
        finalVariants,
        defaultCustomizationOptions,
      );

      const pdpCustomization = serializePdpCustomizationConfig(
        buildPdpCustomizationItems(pdpCustomizationForm, attributes),
      );

      let sanitizedVariants: Record<string, unknown>[];
      try {
        sanitizedVariants = finalVariantsWithCustomization.map((v) =>
          sanitizeVariantForCreate(v as Record<string, unknown>),
        );
      } catch {
        alert(t('admin.products.add.priceRequired'));
        setLoading(false);
        return;
      }

      if (sanitizedVariants.length === 0) {
        alert(t('admin.products.add.variableVariantsRequired'));
        setLoading(false);
        return;
      }

      await createAndSubmitPayload({
        formData: formDataForSubmit,
        finalPrimaryCategoryId,
        variants: sanitizedVariants,
        attributeIds,
        foodTasteFlags,
        pdpCustomization,
        finalMedia,
        mainImage,
        isEditMode,
        productId,
        creationMessages,
        setLoading,
        router,
      });
    } catch (err: unknown) {
      logger.error('[ADMIN] Error saving product', err);
      let message = t('admin.products.add.saveFailed');
      if (err instanceof ApiError) {
        const data = err.data;
        if (data && typeof data === 'object' && 'detail' in data && typeof data.detail === 'string') {
          message = data.detail;
        } else if (err.message) {
          message = err.message;
        }
      } else if (err instanceof Error && err.message) {
        message = err.message;
      }
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return { handleSubmit };
}
