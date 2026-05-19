'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getStoredCurrency } from '../../../lib/currency';
import { getStoredLanguage, type LanguageCode } from '../../../lib/language';
import { useAttributeGroups } from './useAttributeGroups';
import { useProductImages } from './hooks/useProductImages';
import { useProductFetch } from './hooks/useProductFetch';
import { useReviews } from '../../../components/ProductReviews/hooks/useReviews';
import { calculateAverageRating } from '../../../components/ProductReviews/utils';
import { useVariantSelection, otherAttributeSelectionsFromVariant } from './hooks/useVariantSelection';
import { useProductQuantity } from './hooks/useProductQuantity';
import { useProductCalculations } from './hooks/useProductCalculations';
import type { Product } from './types';
import type { StorefrontLocale } from '@/lib/i18n/locale';

export interface UseProductPageProps {
  slug: string;
  variantIdFromUrl: string | null;
  initialProduct: Product | null;
  initialNotFound: boolean;
  serverLocale: StorefrontLocale;
}

export function useProductPage({
  slug,
  variantIdFromUrl,
  initialProduct,
  initialNotFound,
  serverLocale,
}: UseProductPageProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currency, setCurrency] = useState(getStoredCurrency());
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [thumbnailStartIndex, setThumbnailStartIndex] = useState(0);
  const [additions, setAdditions] = useState('');
  const [exclusions, setExclusions] = useState('');

  const {
    product,
    loading,
    notFound,
  } = useProductFetch({
    slug,
    variantIdFromUrl,
    initialProduct,
    initialNotFound,
    serverLocale,
  });

  const images = useProductImages(product);

  const {
    selectedVariant,
    setSelectedVariant,
    selectedColor,
    setSelectedColor,
    selectedSize,
    setSelectedSize,
    selectedAttributeValues,
    setSelectedAttributeValues,
    currentVariant,
    getOptionValue,
    handleColorSelect,
    handleSizeSelect,
    handleAttributeValueSelect,
  } = useVariantSelection({
    product,
    images,
    setCurrentImageIndex,
  });

  const attributeGroups = useAttributeGroups({
    product,
    selectedColor,
    selectedSize,
    selectedAttributeValues,
  });

  const {
    price,
    originalPrice,
    compareAtPrice,
    discountPercent,
    isOutOfStock,
    colorGroups,
    sizeGroups,
    unavailableAttributes,
    canAddToCart,
  } = useProductCalculations({
    product,
    currentVariant,
    attributeGroups,
    selectedAttributeValues,
  });

  const { quantity, setQuantity, maxQuantity, adjustQuantity } = useProductQuantity({
    currentVariant,
    isOutOfStock,
  });

  const { reviews, loading: reviewsLoading, setReviews } = useReviews(
    product?.id,
    slug || undefined
  );

  const averageRating = useMemo(() => calculateAverageRating(reviews), [reviews]);

  useEffect(() => {
    setLanguage(getStoredLanguage());
  }, []);

  useEffect(() => {
    const handleCurrencyUpdate = () => setCurrency(getStoredCurrency());
    const handleCurrencyRatesUpdate = () => setCurrency(getStoredCurrency());
    
    window.addEventListener('currency-updated', handleCurrencyUpdate);
    window.addEventListener('currency-rates-updated', handleCurrencyRatesUpdate);
    
    return () => {
      window.removeEventListener('currency-updated', handleCurrencyUpdate);
      window.removeEventListener('currency-rates-updated', handleCurrencyRatesUpdate);
    };
  }, []);

  useEffect(() => {
    if (images.length > 0 && currentImageIndex >= images.length) {
      setCurrentImageIndex(0);
    }
  }, [images.length, currentImageIndex]);

  useEffect(() => {
    if (product && product.variants && product.variants.length > 0 && variantIdFromUrl) {
      const variantById = product.variants.find((v) => v.id === variantIdFromUrl || v.id.endsWith(variantIdFromUrl ?? ''));
      const variantByIndex = product.variants[parseInt(variantIdFromUrl ?? '', 10) - 1];
      const initialVariant = variantById || variantByIndex || product.variants[0];
      setSelectedVariant(initialVariant);
      setCurrentImageIndex(0);
      setThumbnailStartIndex(0);
      const colorValue = getOptionValue(initialVariant.options, 'color');
      const sizeValue = getOptionValue(initialVariant.options, 'size');
      if (colorValue) setSelectedColor(colorValue);
      else setSelectedColor(null);
      if (sizeValue) setSelectedSize(sizeValue);
      else setSelectedSize(null);
      setSelectedAttributeValues(otherAttributeSelectionsFromVariant(initialVariant));
    }
  }, [
    product,
    variantIdFromUrl,
    setSelectedVariant,
    setSelectedColor,
    setSelectedSize,
    setSelectedAttributeValues,
    getOptionValue,
  ]);

  const scrollToReviews = useCallback(() => {
    const reviewsElement = document.getElementById('product-reviews');
    if (reviewsElement) {
      reviewsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return {
    product,
    loading,
    notFound,
    images,
    currentImageIndex,
    setCurrentImageIndex,
    thumbnailStartIndex,
    setThumbnailStartIndex,
    currency,
    language,
    selectedVariant,
    selectedColor,
    selectedSize,
    selectedAttributeValues,
    isAddingToCart,
    setIsAddingToCart,
    additions,
    exclusions,
    setAdditions,
    setExclusions,
    quantity,
    reviews,
    reviewsLoading,
    setReviews,
    averageRating,
    slug,
    attributeGroups,
    colorGroups,
    sizeGroups,
    currentVariant,
    price,
    originalPrice,
    compareAtPrice,
    discountPercent,
    maxQuantity,
    isOutOfStock,
    unavailableAttributes,
    canAddToCart,
    scrollToReviews,
    getOptionValue,
    adjustQuantity,
    handleColorSelect,
    handleSizeSelect,
    handleAttributeValueSelect,
  };
}
