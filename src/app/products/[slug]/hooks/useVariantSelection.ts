import { useState, useEffect, useCallback, useMemo } from 'react';
import { hasSellableStock } from '@/lib/product-stock';
import { getOptionValue } from '../utils/variant-helpers';
import { findVariantByColorAndSize, findVariantByAllAttributes } from '../utils/variant-finders';
import { switchToVariantImage, handleColorSelect as handleColorSelectUtil } from '../utils/image-switching';
import type { Product, ProductVariant, VariantOption } from '../types';

export function otherAttributeSelectionsFromVariant(variant: ProductVariant | null): Map<string, string> {
  const next = new Map<string, string>();
  if (!variant?.options) return next;
  for (const opt of variant.options) {
    const key = opt.key || opt.attribute || '';
    if (!key || key === 'color' || key === 'size') continue;
    if (opt.valueId) {
      next.set(key, opt.valueId);
    } else if (opt.value) {
      next.set(key, opt.value.trim());
    }
  }
  return next;
}

interface UseVariantSelectionProps {
  product: Product | null;
  images: string[];
  setCurrentImageIndex: (index: number) => void;
}

export function useVariantSelection({
  product,
  images,
  setCurrentImageIndex,
}: UseVariantSelectionProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedAttributeValues, setSelectedAttributeValues] = useState<Map<string, string>>(new Map());

  const getOptionValueFn = useCallback((options: VariantOption[] | undefined, key: string): string | null => {
    return getOptionValue(options, key);
  }, []);

  const findVariantByColorAndSizeFn = useCallback((color: string | null, size: string | null): ProductVariant | null => {
    return findVariantByColorAndSize(product, color, size);
  }, [product]);

  const findVariantByAllAttributesFn = useCallback((
    color: string | null,
    size: string | null,
    otherAttributes: Map<string, string>
  ): ProductVariant | null => {
    return findVariantByAllAttributes(product, color, size, otherAttributes);
  }, [product]);

  const switchToVariantImageFn = useCallback((variant: ProductVariant | null) => {
    switchToVariantImage(variant, product, images, setCurrentImageIndex);
  }, [product, images, setCurrentImageIndex]);

  // Initialize variant when product changes
  useEffect(() => {
    if (product && product.variants && product.variants.length > 0 && !selectedVariant) {
      const initialVariant = product.variants[0];
      setSelectedVariant(initialVariant);
      const colorValue = getOptionValueFn(initialVariant.options, 'color');
      const sizeValue = getOptionValueFn(initialVariant.options, 'size');
      if (colorValue) setSelectedColor(colorValue);
      if (sizeValue) setSelectedSize(sizeValue);
      setSelectedAttributeValues(otherAttributeSelectionsFromVariant(initialVariant));
    }
  }, [product, selectedVariant, getOptionValueFn, setSelectedVariant, setSelectedColor, setSelectedSize]);

  // Update variant when selections change (partial selections allowed — fall back to best match)
  useEffect(() => {
    if (!product?.variants?.length) return;
    const relaxed =
      findVariantByAllAttributesFn(selectedColor, selectedSize, selectedAttributeValues) ??
      findVariantByColorAndSizeFn(selectedColor, selectedSize) ??
      product.variants.find((v) => hasSellableStock(v.stock)) ??
      product.variants[0] ??
      null;
    if (!relaxed) return;
    if (relaxed.id !== selectedVariant?.id) {
      setSelectedVariant(relaxed);
      switchToVariantImageFn(relaxed);
    } else if (relaxed.imageUrl) {
      switchToVariantImageFn(relaxed);
    }
  }, [
    selectedColor,
    selectedSize,
    selectedAttributeValues,
    findVariantByAllAttributesFn,
    findVariantByColorAndSizeFn,
    selectedVariant?.id,
    product,
    switchToVariantImageFn,
    setSelectedVariant,
  ]);

  const handleColorSelect = useCallback((color: string) => {
    handleColorSelectUtil(
      color,
      product,
      images,
      selectedColor,
      setSelectedColor,
      setCurrentImageIndex
    );
  }, [product, images, selectedColor, setSelectedColor, setCurrentImageIndex]);

  const handleSizeSelect = useCallback((size: string) => {
    if (selectedSize === size) {
      setSelectedSize(null);
    } else {
      setSelectedSize(size);
    }
  }, [selectedSize, setSelectedSize]);

  const handleAttributeValueSelect = useCallback((attrKey: string, value: string) => {
    const newMap = new Map(selectedAttributeValues);
    const trimmed = value.trim();
    if (trimmed === '') {
      newMap.delete(attrKey);
      setSelectedAttributeValues(newMap);
      return;
    }
    const currentValue = selectedAttributeValues.get(attrKey);
    if (currentValue === trimmed) {
      newMap.delete(attrKey);
    } else {
      newMap.set(attrKey, trimmed);
    }
    setSelectedAttributeValues(newMap);
  }, [selectedAttributeValues]);

  const currentVariant = useMemo(() => {
    if (!product?.variants?.length) return null;
    return (
      findVariantByAllAttributesFn(selectedColor, selectedSize, selectedAttributeValues) ??
      findVariantByColorAndSizeFn(selectedColor, selectedSize) ??
      selectedVariant ??
      product.variants.find((v) => hasSellableStock(v.stock)) ??
      product.variants[0] ??
      null
    );
  }, [
    product,
    selectedColor,
    selectedSize,
    selectedAttributeValues,
    findVariantByAllAttributesFn,
    findVariantByColorAndSizeFn,
    selectedVariant,
  ]);

  return {
    selectedVariant,
    setSelectedVariant,
    selectedColor,
    setSelectedColor,
    selectedSize,
    setSelectedSize,
    selectedAttributeValues,
    setSelectedAttributeValues,
    currentVariant,
    getOptionValue: getOptionValueFn,
    handleColorSelect,
    handleSizeSelect,
    handleAttributeValueSelect,
  };
}

