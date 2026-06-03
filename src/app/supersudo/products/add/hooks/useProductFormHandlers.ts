import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { convertPrice, type CurrencyCode } from '@/lib/currency';
import type { Attribute, Variant, GeneratedVariant } from '../types';
import { useBrandAndCategoryCreation } from './useBrandAndCategoryCreation';
import { useVariantConversionToFormData } from './useVariantConversionToFormData';
import { useVariantValidation } from './useVariantValidation';
import { processImagesForSubmit } from './useImageProcessingForSubmit';
import { createAndSubmitPayload } from './useProductPayloadCreation';
import { parseAdminStockInput } from '@/lib/product-stock';
import { logger } from "@/lib/utils/logger";
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
import { generateSkuFromSlug, resolveProductSlug } from '../utils/productUtils';
import { sanitizeVariantForCreate } from '../utils/sanitize-admin-variant';
import { ApiError } from '@/lib/api-client/types';
import { useTranslation } from '@/lib/i18n-client';

interface UseProductFormHandlersProps {
  formData: {
    title: string;
    slug: string;
    descriptionHtml: string;
    primaryCategoryId: string;
    categoryIds: string[];
    published: boolean;
    featured: boolean;
    imageUrls: string[];
    featuredImageIndex: number;
    mainProductImage: string;
    variants: Variant[];
    labels: any[];
  };
  setFormData: (updater: (prev: any) => any) => void;
  setLoading: (loading: boolean) => void;
  setCategories: (updater: (prev: any[]) => any[]) => void;
  productType: 'simple' | 'variable';
  simpleProductData: {
    price: string;
    compareAtPrice: string;
    sku: string;
    quantity: string;
  };
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
}: UseProductFormHandlersProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const { createBrandAndCategory } = useBrandAndCategoryCreation({
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

      // Create brand and category if needed
      const brandCategoryResult = await createBrandAndCategory();
      if (brandCategoryResult.error) {
        return;
      }
      const { finalPrimaryCategoryId, creationMessages } = brandCategoryResult;

      // Convert generated variants to formData format
      convertGeneratedVariantsToFormData();

      // Get current formData after potential update
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

      // Process variants for API
      const variants: any[] = [];
      const variantSkuSet = new Set<string>();

      if (submitAsSimple) {
        logger.debug('📦 [ADMIN] Processing Simple Product');
        const priceUSD = convertPrice(parseFloat(simpleProductData.price), defaultCurrency, 'USD');
        let compareAtPriceUSD: number | undefined;
        if (simpleProductData.compareAtPrice.trim() !== '') {
          const compareParsed = Number.parseFloat(simpleProductData.compareAtPrice);
          if (Number.isFinite(compareParsed) && compareParsed > 0) {
            compareAtPriceUSD = convertPrice(compareParsed, defaultCurrency, 'USD');
          }
        }
        const finalSimpleSku = generateSkuFromSlug(resolvedSlug, 1);
        const simpleVariant: any = {
          price: priceUSD,
          stock: parseAdminStockInput(simpleProductData.quantity),
          sku: finalSimpleSku,
          published: true,
        };
        if (compareAtPriceUSD) {
          simpleVariant.compareAtPrice = compareAtPriceUSD;
        }
        variants.push(simpleVariant);
        variantSkuSet.add(finalSimpleSku);
        logger.debug('✅ [ADMIN] Simple product variant created:', simpleVariant);
      } else {
        // Variable products variant processing (simplified - full logic remains in original)
        const useGeneratedVariants = generatedVariants.length > 0;
        
        if (useGeneratedVariants) {
          logger.debug('📦 [ADMIN] Using generatedVariants format:', generatedVariants.length, 'variants');
          const sizeAttribute = getSizeAttribute();
          
          generatedVariants.forEach((genVariant, variantIndex) => {
            const variantPriceUSD = convertPrice(parseFloat(genVariant.price || '0'), defaultCurrency, 'USD');
            const variantCompareAtPriceUSD = genVariant.compareAtPrice 
              ? convertPrice(parseFloat(genVariant.compareAtPrice), defaultCurrency, 'USD')
              : undefined;
            
            const attributeValueMap: Record<string, Array<{ valueId: string; value: string }>> = {};
            
            genVariant.selectedValueIds.forEach((valueId) => {
              const attribute = attributes.find(a => a.values.some(v => v.id === valueId));
              if (attribute) {
                const value = attribute.values.find(v => v.id === valueId);
                if (value) {
                  if (!attributeValueMap[attribute.key]) {
                    attributeValueMap[attribute.key] = [];
                  }
                  attributeValueMap[attribute.key].push({ valueId: value.id, value: value.value });
                }
              }
            });
            
            const attributeKeys = Object.keys(attributeValueMap);
            if (attributeKeys.length === 0) {
              const finalSku = genVariant.sku || `${resolvedSlug}-${Date.now()}-${variantIndex + 1}`;
              let uniqueSku = finalSku;
              let skuCounter = 1;
              while (variantSkuSet.has(uniqueSku)) {
                uniqueSku = `${finalSku}-${skuCounter}`;
                skuCounter++;
              }
              variantSkuSet.add(uniqueSku);
              variants.push({
                price: variantPriceUSD,
                compareAtPrice: variantCompareAtPriceUSD,
                stock: parseAdminStockInput(genVariant.stock),
                sku: uniqueSku,
                imageUrl: genVariant.image || undefined,
                published: true,
              });
            } else {
              const attributeValueGroups = attributeKeys.map(key => 
                attributeValueMap[key].map(v => v.valueId)
              );
              
              const generateCombinations = (groups: string[][]): string[][] => {
                if (groups.length === 0) return [[]];
                if (groups.length === 1) return groups[0].map(v => [v]);
                const [firstGroup, ...restGroups] = groups;
                const restCombinations = generateCombinations(restGroups);
                const result: string[][] = [];
                for (const value of firstGroup) {
                  for (const combination of restCombinations) {
                    result.push([value, ...combination]);
                  }
                }
                return result;
              };
              
              const combinations = generateCombinations(attributeValueGroups);
              
              combinations.forEach((combination, comboIndex) => {
                const variantOptions: Array<{ attributeKey: string; value: string; valueId?: string }> = [];
                combination.forEach((valueId) => {
                  const attribute = attributes.find(a => a.values.some(v => v.id === valueId));
                  if (attribute) {
                    const value = attribute.values.find(v => v.id === valueId);
                    if (value) {
                      variantOptions.push({ attributeKey: attribute.key, value: value.value, valueId: value.id });
                    }
                  }
                });
                
                const baseSlug = resolvedSlug;
                const valueParts = variantOptions.map(opt => opt.value.toUpperCase().replace(/\s+/g, '-'));
                const skuSuffix = valueParts.length > 0 ? `-${valueParts.join('-')}` : '';
                const finalSku = genVariant.sku 
                  ? `${genVariant.sku}${skuSuffix}`
                  : `${baseSlug.toUpperCase()}-${Date.now()}-${variantIndex + 1}-${comboIndex + 1}${skuSuffix}`;
                
                let uniqueSku = finalSku;
                let skuCounter = 1;
                while (variantSkuSet.has(uniqueSku)) {
                  uniqueSku = `${finalSku}-${skuCounter}`;
                  skuCounter++;
                }
                variantSkuSet.add(uniqueSku);
                
                variants.push({
                  price: variantPriceUSD,
                  compareAtPrice: variantCompareAtPriceUSD,
                  stock: parseAdminStockInput(genVariant.stock),
                  sku: uniqueSku,
                  imageUrl: genVariant.image || undefined,
                  published: true,
                  options: variantOptions.length > 0 ? variantOptions : undefined,
                });
              });
            }
          });
        } else {
          // Legacy formData.variants processing (simplified)
          logger.debug('📦 [ADMIN] Using formData.variants format (legacy)');
          currentFormData.variants.forEach((variant, variantIndex) => {
            const variantPriceUSD = convertPrice(parseFloat(variant.price || '0'), defaultCurrency, 'USD');
            const baseVariantData: any = { price: variantPriceUSD, published: true };
            if (variant.compareAtPrice) {
              baseVariantData.compareAtPrice = convertPrice(parseFloat(variant.compareAtPrice), defaultCurrency, 'USD');
            }
            const colorDataArray = variant.colors || [];
            // Simplified variant processing - full logic would be in separate hook
            if (colorDataArray.length > 0) {
              colorDataArray.forEach((colorData, colorIndex) => {
                const colorSizes = colorData.sizes || [];
                const colorSizeStocks = colorData.sizeStocks || {};
                if (colorSizes.length > 0) {
                  colorSizes.forEach((size) => {
                    const stockForVariant = colorSizeStocks[size] || colorData.stock || '0';
                    const skuSuffix = colorDataArray.length > 1 || colorSizes.length > 1 
                      ? `-${colorIndex + 1}-${colorSizes.indexOf(size) + 1}` : '';
                    let finalSku = colorData.sizeLabels?.[size] || variant.sku ? `${variant.sku?.trim()}${skuSuffix}` : undefined;
                    if (!finalSku || finalSku === '') {
                      finalSku = `${resolvedSlug}-${Date.now()}-${variantIndex + 1}-${colorIndex + 1}-${colorSizes.indexOf(size) + 1}`;
                    }
                    let uniqueSku = finalSku;
                    let skuCounter = 1;
                    while (variantSkuSet.has(uniqueSku)) {
                      uniqueSku = `${finalSku}-${skuCounter}`;
                      skuCounter++;
                    }
                    variantSkuSet.add(uniqueSku);
                    const variantImageUrl = colorData.images && colorData.images.length > 0 ? colorData.images.join(',') : undefined;
                    const sizePrice = colorData.sizePrices?.[size];
                    const finalPriceRaw = sizePrice && sizePrice.trim() !== ''
                      ? parseFloat(sizePrice)
                      : (colorData.price && colorData.price.trim() !== '' ? parseFloat(colorData.price) : baseVariantData.price);
                    const finalPrice = convertPrice(finalPriceRaw, defaultCurrency, 'USD');
                    const variantOptions: Array<{ attributeKey: string; value: string; valueId?: string }> = [];
                    if (colorData.colorValue && colorData.colorValue.trim() !== '') {
                      const colorAttr = attributes.find(a => a.key === 'color');
                      const colorValue = colorAttr?.values.find(v => v.value === colorData.colorValue);
                      if (colorValue) {
                        variantOptions.push({ attributeKey: 'color', value: colorData.colorValue, valueId: colorValue.id });
                      } else {
                        variantOptions.push({ attributeKey: 'color', value: colorData.colorValue });
                      }
                    }
                    if (size && size.trim() !== '') {
                      const sizeAttr = attributes.find(a => a.key === 'size');
                      const sizeValue = sizeAttr?.values.find(v => v.value === size);
                      if (sizeValue) {
                        variantOptions.push({ attributeKey: 'size', value: size, valueId: sizeValue.id });
                      } else {
                        variantOptions.push({ attributeKey: 'size', value: size });
                      }
                    }
                    variants.push({
                      ...baseVariantData,
                      price: finalPrice,
                      color: colorData.colorValue,
                      size: size,
                      stock: parseAdminStockInput(stockForVariant),
                      sku: uniqueSku,
                      imageUrl: variantImageUrl,
                      options: variantOptions.length > 0 ? variantOptions : undefined,
                    });
                  });
                } else {
                  // Loaded variable products often use a single "default" color row with no sizes;
                  // skipping here previously produced zero API variants and wiped all DB variants on save.
                  const stockForVariant = colorData.stock || '0';
                  const skuSuffix = colorDataArray.length > 1 ? `-${colorIndex + 1}` : '';
                  let finalSku =
                    colorData.sizeLabels && Object.keys(colorData.sizeLabels).length > 0
                      ? undefined
                      : variant.sku
                        ? `${variant.sku.trim()}${skuSuffix}`
                        : undefined;
                  if (!finalSku || finalSku === '') {
                    finalSku = `${resolvedSlug}-${Date.now()}-${variantIndex + 1}-${colorIndex + 1}`;
                  }
                  let uniqueSku = finalSku;
                  let skuCounter = 1;
                  while (variantSkuSet.has(uniqueSku)) {
                    uniqueSku = `${finalSku}-${skuCounter}`;
                    skuCounter++;
                  }
                  variantSkuSet.add(uniqueSku);
                  const variantImageUrl =
                    colorData.images && colorData.images.length > 0 ? colorData.images.join(',') : undefined;
                  const finalPriceRaw =
                    colorData.price && colorData.price.trim() !== ''
                      ? parseFloat(colorData.price)
                      : baseVariantData.price;
                  const finalPrice = convertPrice(finalPriceRaw, defaultCurrency, 'USD');
                  const variantOptions: Array<{ attributeKey: string; value: string; valueId?: string }> = [];
                  if (
                    colorData.colorValue &&
                    colorData.colorValue.trim() !== '' &&
                    colorData.colorValue !== 'default'
                  ) {
                    const colorAttr = attributes.find((a) => a.key === 'color');
                    const colorValue = colorAttr?.values.find((v) => v.value === colorData.colorValue);
                    if (colorValue) {
                      variantOptions.push({
                        attributeKey: 'color',
                        value: colorData.colorValue,
                        valueId: colorValue.id,
                      });
                    } else {
                      variantOptions.push({ attributeKey: 'color', value: colorData.colorValue });
                    }
                  }
                  variants.push({
                    ...baseVariantData,
                    price: finalPrice,
                    color: colorData.colorValue,
                    size: '',
                    stock: parseAdminStockInput(stockForVariant),
                    sku: uniqueSku,
                    imageUrl: variantImageUrl,
                    options: variantOptions.length > 0 ? variantOptions : undefined,
                  });
                }
              });
            }
          });
        }
      }

      if (!submitAsSimple && variants.length === 0) {
        logger.error('[ADMIN] Refusing save: variable product would persist zero variants (data loss).');
        alert(t('admin.products.add.variableVariantsRequired'));
        setLoading(false);
        return;
      }

      // Final SKU validation
      const finalSkuSet = new Set<string>();
      for (let i = 0; i < variants.length; i++) {
        const variant = variants[i];
        if (!variant.sku || variant.sku.trim() === '') {
          const baseSlug = resolvedSlug;
          variant.sku = `${baseSlug.toUpperCase()}-${Date.now()}-${i + 1}`;
        } else {
          variant.sku = variant.sku.trim();
        }
        let finalSku = variant.sku;
        let skuCounter = 1;
        while (finalSkuSet.has(finalSku)) {
          const baseSlug = resolvedSlug;
          finalSku = `${baseSlug.toUpperCase()}-${Date.now()}-${i + 1}-${skuCounter}-${Math.random().toString(36).substr(2, 4)}`;
          skuCounter++;
        }
        variant.sku = finalSku;
        finalSkuSet.add(finalSku);
      }

      // Collect attribute IDs (variant UI + color/size used for clothing)
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
      const attributeIds = Array.from(attributeIdsSet);

      const pricePatches = collectAttributeValuePricePatches(
        pdpCustomizationForm,
        attributes,
        selectedPdpCustomizationAttributeIds,
      );
      if (pricePatches.length > 0) {
        await syncAttributeValuePricePatches(pricePatches);
      }

      // Process images
      const { finalMedia, mainImage, processedVariants } = processImagesForSubmit({
        imageUrls: currentFormData.imageUrls,
        featuredImageIndex: currentFormData.featuredImageIndex,
        mainProductImage: currentFormData.mainProductImage,
        variants: variants,
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
        buildPdpCustomizationItems(pdpCustomizationForm),
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

      // Create and submit payload
      await createAndSubmitPayload({
        formData: formDataForSubmit,
        finalPrimaryCategoryId,
        variants: sanitizedVariants,
        attributeIds,
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
      console.error('❌ [ADMIN] Error saving product:', err);
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
