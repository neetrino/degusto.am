import { convertPrice, type CurrencyCode } from '@/lib/currency';
import { parseAdminStockInput } from '@/lib/product-stock';
import { logger } from '@/lib/utils/logger';
import type { Attribute, GeneratedVariant, Variant } from '../types';
import { generateSkuFromSlug } from '../utils/productUtils';

export interface ProductSubmitVariant {
  price: number;
  stock: number;
  sku: string;
  published: boolean;
  compareAtPrice?: number;
  imageUrl?: string;
  color?: string;
  size?: string;
  options?: Array<{ attributeKey: string; value: string; valueId?: string }>;
}

export interface BuildVariantsForSubmitParams {
  submitAsSimple: boolean;
  simpleProductData: {
    price: string;
    compareAtPrice: string;
    quantity: string;
  };
  defaultCurrency: CurrencyCode;
  resolvedSlug: string;
  generatedVariants: GeneratedVariant[];
  formVariants: Variant[];
  attributes: Attribute[];
}

function generateAttributeCombinations(groups: string[][]): string[][] {
  if (groups.length === 0) return [[]];
  if (groups.length === 1) return groups[0].map((v) => [v]);
  const [firstGroup, ...restGroups] = groups;
  const restCombinations = generateAttributeCombinations(restGroups);
  const result: string[][] = [];
  for (const value of firstGroup) {
    for (const combination of restCombinations) {
      result.push([value, ...combination]);
    }
  }
  return result;
}

function addUniqueSku(
  variantSkuSet: Set<string>,
  baseSku: string,
): string {
  let uniqueSku = baseSku;
  let skuCounter = 1;
  while (variantSkuSet.has(uniqueSku)) {
    uniqueSku = `${baseSku}-${skuCounter}`;
    skuCounter++;
  }
  variantSkuSet.add(uniqueSku);
  return uniqueSku;
}

function buildSimpleProductVariant(
  params: BuildVariantsForSubmitParams,
  variantSkuSet: Set<string>,
): ProductSubmitVariant[] {
  const { simpleProductData, defaultCurrency, resolvedSlug } = params;
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
  const simpleVariant: ProductSubmitVariant = {
    price: priceUSD,
    stock: parseAdminStockInput(simpleProductData.quantity),
    sku: finalSimpleSku,
    published: true,
  };
  if (compareAtPriceUSD) {
    simpleVariant.compareAtPrice = compareAtPriceUSD;
  }
  variantSkuSet.add(finalSimpleSku);
  logger.debug('✅ [ADMIN] Simple product variant created:', simpleVariant);
  return [simpleVariant];
}

function buildFromGeneratedVariants(
  params: BuildVariantsForSubmitParams,
  variantSkuSet: Set<string>,
): ProductSubmitVariant[] {
  const { generatedVariants, defaultCurrency, resolvedSlug, attributes } = params;
  const variants: ProductSubmitVariant[] = [];

  logger.debug('📦 [ADMIN] Using generatedVariants format:', generatedVariants.length, 'variants');

  generatedVariants.forEach((genVariant, variantIndex) => {
    const variantPriceUSD = convertPrice(parseFloat(genVariant.price || '0'), defaultCurrency, 'USD');
    const variantCompareAtPriceUSD = genVariant.compareAtPrice
      ? convertPrice(parseFloat(genVariant.compareAtPrice), defaultCurrency, 'USD')
      : undefined;

    const attributeValueMap: Record<string, Array<{ valueId: string; value: string }>> = {};

    genVariant.selectedValueIds.forEach((valueId) => {
      const attribute = attributes.find((a) => a.values.some((v) => v.id === valueId));
      if (attribute) {
        const value = attribute.values.find((v) => v.id === valueId);
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
      const uniqueSku = addUniqueSku(variantSkuSet, finalSku);
      variants.push({
        price: variantPriceUSD,
        compareAtPrice: variantCompareAtPriceUSD,
        stock: parseAdminStockInput(genVariant.stock),
        sku: uniqueSku,
        imageUrl: genVariant.image || undefined,
        published: true,
      });
      return;
    }

    const attributeValueGroups = attributeKeys.map((key) =>
      attributeValueMap[key].map((v) => v.valueId),
    );
    const combinations = generateAttributeCombinations(attributeValueGroups);

    combinations.forEach((combination, comboIndex) => {
      const variantOptions: Array<{ attributeKey: string; value: string; valueId?: string }> = [];
      combination.forEach((valueId) => {
        const attribute = attributes.find((a) => a.values.some((v) => v.id === valueId));
        if (attribute) {
          const value = attribute.values.find((v) => v.id === valueId);
          if (value) {
            variantOptions.push({
              attributeKey: attribute.key,
              value: value.value,
              valueId: value.id,
            });
          }
        }
      });

      const valueParts = variantOptions.map((opt) => opt.value.toUpperCase().replace(/\s+/g, '-'));
      const skuSuffix = valueParts.length > 0 ? `-${valueParts.join('-')}` : '';
      const finalSku = genVariant.sku
        ? `${genVariant.sku}${skuSuffix}`
        : `${resolvedSlug.toUpperCase()}-${Date.now()}-${variantIndex + 1}-${comboIndex + 1}${skuSuffix}`;
      const uniqueSku = addUniqueSku(variantSkuSet, finalSku);

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
  });

  return variants;
}

function buildFromLegacyFormVariants(
  params: BuildVariantsForSubmitParams,
  variantSkuSet: Set<string>,
): ProductSubmitVariant[] {
  const { formVariants, defaultCurrency, resolvedSlug, attributes } = params;
  const variants: ProductSubmitVariant[] = [];

  logger.debug('📦 [ADMIN] Using formData.variants format (legacy)');

  formVariants.forEach((variant, variantIndex) => {
    const variantPriceUSD = convertPrice(parseFloat(variant.price || '0'), defaultCurrency, 'USD');
    const baseVariantData: Pick<ProductSubmitVariant, 'price' | 'published' | 'compareAtPrice'> = {
      price: variantPriceUSD,
      published: true,
    };
    if (variant.compareAtPrice) {
      baseVariantData.compareAtPrice = convertPrice(
        parseFloat(variant.compareAtPrice),
        defaultCurrency,
        'USD',
      );
    }
    const colorDataArray = variant.colors || [];
    if (colorDataArray.length === 0) {
      return;
    }

    colorDataArray.forEach((colorData, colorIndex) => {
      const colorSizes = colorData.sizes || [];
      const colorSizeStocks = colorData.sizeStocks || {};
      if (colorSizes.length > 0) {
        colorSizes.forEach((size) => {
          const stockForVariant = colorSizeStocks[size] || colorData.stock || '0';
          const skuSuffix =
            colorDataArray.length > 1 || colorSizes.length > 1
              ? `-${colorIndex + 1}-${colorSizes.indexOf(size) + 1}`
              : '';
          let finalSku =
            colorData.sizeLabels?.[size] || variant.sku
              ? `${variant.sku?.trim()}${skuSuffix}`
              : undefined;
          if (!finalSku || finalSku === '') {
            finalSku = `${resolvedSlug}-${Date.now()}-${variantIndex + 1}-${colorIndex + 1}-${colorSizes.indexOf(size) + 1}`;
          }
          const uniqueSku = addUniqueSku(variantSkuSet, finalSku);
          const variantImageUrl =
            colorData.images && colorData.images.length > 0 ? colorData.images.join(',') : undefined;
          const sizePrice = colorData.sizePrices?.[size];
          const finalPriceRaw =
            sizePrice && sizePrice.trim() !== ''
              ? parseFloat(sizePrice)
              : colorData.price && colorData.price.trim() !== ''
                ? parseFloat(colorData.price)
                : baseVariantData.price;
          const finalPrice = convertPrice(finalPriceRaw, defaultCurrency, 'USD');
          const variantOptions: Array<{ attributeKey: string; value: string; valueId?: string }> = [];
          if (colorData.colorValue && colorData.colorValue.trim() !== '') {
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
          if (size && size.trim() !== '') {
            const sizeAttr = attributes.find((a) => a.key === 'size');
            const sizeValue = sizeAttr?.values.find((v) => v.value === size);
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
            size,
            stock: parseAdminStockInput(stockForVariant),
            sku: uniqueSku,
            imageUrl: variantImageUrl,
            options: variantOptions.length > 0 ? variantOptions : undefined,
          });
        });
        return;
      }

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
      const uniqueSku = addUniqueSku(variantSkuSet, finalSku);
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
    });
  });

  return variants;
}

/** Builds API-ready variants and deduplicates SKUs before submit. */
export function buildVariantsForProductSubmit(
  params: BuildVariantsForSubmitParams,
): ProductSubmitVariant[] {
  const variantSkuSet = new Set<string>();

  let variants: ProductSubmitVariant[];
  if (params.submitAsSimple) {
    variants = buildSimpleProductVariant(params, variantSkuSet);
  } else if (params.generatedVariants.length > 0) {
    variants = buildFromGeneratedVariants(params, variantSkuSet);
  } else {
    variants = buildFromLegacyFormVariants(params, variantSkuSet);
  }

  const finalSkuSet = new Set<string>();
  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i];
    if (!variant.sku || variant.sku.trim() === '') {
      variant.sku = `${params.resolvedSlug.toUpperCase()}-${Date.now()}-${i + 1}`;
    } else {
      variant.sku = variant.sku.trim();
    }
    let finalSku = variant.sku;
    let skuCounter = 1;
    while (finalSkuSet.has(finalSku)) {
      finalSku = `${params.resolvedSlug.toUpperCase()}-${Date.now()}-${i + 1}-${skuCounter}-${Math.random().toString(36).substr(2, 4)}`;
      skuCounter++;
    }
    variant.sku = finalSku;
    finalSkuSet.add(finalSku);
  }

  return variants;
}
