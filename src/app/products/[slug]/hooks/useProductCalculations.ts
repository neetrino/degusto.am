import { useMemo } from 'react';
import { findGroupPriceAdjustment } from '@/lib/attributes/price-adjustment';
import { convertPrice, type CurrencyCode } from '../../../../lib/currency';
import { hasSellableStock } from '@/lib/product-stock';
import { resolveStorefrontDiscountPercent } from '@/lib/storefront/discount-percent';
import type { LanguageCode } from '../../../../lib/language';
import { isPdpCustomizationAttributeKey } from '../constants/pdp-customization-ingredients';
import { sumCustomizationAdditionPrice } from '../utils/resolve-pdp-customization-ingredients';
import type { Product, ProductVariant, AttributeGroupValue } from '../types';

interface UseProductCalculationsProps {
  product: Product | null;
  currentVariant: ProductVariant | null;
  attributeGroups: Map<string, AttributeGroupValue[]>;
  selectedAttributeValues: Map<string, string>;
  selectedColor: string | null;
  selectedSize: string | null;
  additions: string;
  language: LanguageCode;
  currency: CurrencyCode;
}

export function useProductCalculations({
  product,
  currentVariant,
  attributeGroups,
  selectedAttributeValues,
  selectedColor,
  selectedSize,
  additions,
  language,
  currency,
}: UseProductCalculationsProps) {
  const attributePriceAdjustmentAmd = useMemo(() => {
    let sum = 0;

    const addFromGroup = (attrKey: string, raw: string | null) => {
      if (!raw || isPdpCustomizationAttributeKey(attrKey)) {
        return;
      }
      const group = attributeGroups.get(attrKey);
      if (!group) {
        return;
      }
      sum += findGroupPriceAdjustment(group, raw);
    };

    addFromGroup('color', selectedColor);
    addFromGroup('size', selectedSize);

    for (const [attrKey, raw] of selectedAttributeValues.entries()) {
      addFromGroup(attrKey, raw);
    }

    return sum;
  }, [attributeGroups, selectedAttributeValues, selectedColor, selectedSize]);

  const attributePriceAdjustmentUsd = useMemo(() => {
    if (attributePriceAdjustmentAmd <= 0) {
      return 0;
    }
    return convertPrice(attributePriceAdjustmentAmd, 'AMD', 'USD');
  }, [attributePriceAdjustmentAmd]);

  const additionPriceAdjustmentUsd = useMemo(() => {
    const amd = sumCustomizationAdditionPrice(product, additions, language, currentVariant);
    if (amd <= 0) {
      return 0;
    }
    return convertPrice(amd, 'AMD', 'USD');
  }, [product, additions, language, currentVariant]);

  const totalPriceAdjustmentUsd = attributePriceAdjustmentUsd + additionPriceAdjustmentUsd;
  const basePriceUsd = currentVariant?.price || 0;
  const unitPriceUsd = basePriceUsd + totalPriceAdjustmentUsd;

  const price =
    currency === 'USD'
      ? unitPriceUsd
      : convertPrice(unitPriceUsd, 'USD', currency);
  const originalPriceUsd =
    currentVariant?.originalPrice != null
      ? currentVariant.originalPrice + totalPriceAdjustmentUsd
      : null;
  const compareAtPriceUsd =
    currentVariant?.compareAtPrice != null
      ? currentVariant.compareAtPrice + totalPriceAdjustmentUsd
      : undefined;
  const originalPrice =
    originalPriceUsd != null
      ? currency === 'USD'
        ? originalPriceUsd
        : convertPrice(originalPriceUsd, 'USD', currency)
      : null;
  const compareAtPrice =
    compareAtPriceUsd != null
      ? currency === 'USD'
        ? compareAtPriceUsd
        : convertPrice(compareAtPriceUsd, 'USD', currency)
      : undefined;
  const discountPercent = resolveStorefrontDiscountPercent({
    price,
    originalPrice,
    compareAtPrice: compareAtPrice ?? null,
    productDiscount: currentVariant?.productDiscount ?? product?.productDiscount ?? null,
  });
  const isOutOfStock = !currentVariant || !hasSellableStock(currentVariant.stock);

  const colorGroups = useMemo(() => {
    const groups: Array<{ color: string; stock: number; variants: ProductVariant[] }> = [];
    const colorAttrGroup = attributeGroups.get('color');
    if (colorAttrGroup) {
      groups.push(...colorAttrGroup.map((g) => ({
        color: g.value,
        stock: g.stock,
        variants: g.variants,
      })));
    }
    return groups;
  }, [attributeGroups]);

  const sizeGroups = useMemo(() => {
    const groups: Array<{ size: string; stock: number; variants: ProductVariant[] }> = [];
    const sizeAttrGroup = attributeGroups.get('size');
    if (sizeAttrGroup) {
      groups.push(...sizeAttrGroup.map((g) => ({
        size: g.value,
        stock: g.stock,
        variants: g.variants,
      })));
    }
    return groups;
  }, [attributeGroups]);

  const unavailableAttributes = useMemo(() => {
    const unavailable = new Map<string, boolean>();
    if (!currentVariant || !product) return unavailable;
    
    currentVariant.options?.forEach((option) => {
      const attrKey = option.key || option.attribute;
      if (!attrKey) return;
      
      const attrGroup = attributeGroups.get(attrKey);
      if (!attrGroup) return;
      
      const attrValue = attrGroup.find((g) => {
        if (option.valueId && g.valueId) return g.valueId === option.valueId;
        return g.value?.toLowerCase().trim() === option.value?.toLowerCase().trim();
      });
      
      if (attrValue && !hasSellableStock(attrValue.stock)) {
        unavailable.set(attrKey, true);
      }
    });
    
    return unavailable;
  }, [currentVariant, attributeGroups, product]);

  const canAddToCart = !isOutOfStock;

  return {
    unitPriceUsd,
    price,
    originalPrice: originalPrice ?? null,
    compareAtPrice: compareAtPrice ?? null,
    discountPercent,
    isOutOfStock,
    colorGroups,
    sizeGroups,
    unavailableAttributes,
    canAddToCart,
  };
}




