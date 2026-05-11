'use client';

import type { MouseEvent } from 'react';
import { Heart } from 'lucide-react';
import Image from 'next/image';
import { formatPrice, type CurrencyCode } from '../../../lib/currency';
import { t, getProductText } from '../../../lib/i18n';
import type { LanguageCode } from '../../../lib/language';
import { sanitizeHtml } from '../../../lib/utils/sanitize';
import { CompareIcon } from '../../../components/icons/CompareIcon';
import { ProductAttributesSelector } from './ProductAttributesSelector';
import { ProductRatingSummary } from './ProductRatingSummary';
import type { Product, ProductVariant } from './types';

interface ProductInfoAndActionsProps {
  product: Product;
  price: number;
  originalPrice: number | null;
  compareAtPrice: number | null;
  discountPercent: number | null;
  currency: string;
  language: LanguageCode;
  averageRating: number;
  reviewsCount: number;
  quantity: number;
  maxQuantity: number;
  isOutOfStock: boolean;
  isVariationRequired: boolean;
  hasUnavailableAttributes: boolean;
  unavailableAttributes: Map<string, boolean>;
  canAddToCart: boolean;
  isAddingToCart: boolean;
  isInWishlist: boolean;
  isInCompare: boolean;
  showMessage: string | null;
  isLoggedIn: boolean;
  currentVariant: ProductVariant | null;
  attributeGroups: Map<string, any[]>;
  selectedColor: string | null;
  selectedSize: string | null;
  selectedAttributeValues: Map<string, string>;
  colorGroups: Array<{ color: string; stock: number; variants: ProductVariant[] }>;
  sizeGroups: Array<{ size: string; stock: number; variants: ProductVariant[] }>;
  onQuantityAdjust: (delta: number) => void;
  onAddToCart: () => Promise<void>;
  onAddToWishlist: (e: MouseEvent) => void;
  onCompareToggle: (e: MouseEvent) => void;
  onScrollToReviews: () => void;
  onColorSelect: (color: string) => void;
  onSizeSelect: (size: string) => void;
  onAttributeValueSelect: (attrKey: string, value: string) => void;
  getOptionValue: (options: any[] | undefined, key: string) => string | null;
  getRequiredAttributesMessage: () => string;
}

export function ProductInfoAndActions({
  product,
  price,
  originalPrice,
  compareAtPrice,
  discountPercent,
  currency,
  language,
  averageRating,
  reviewsCount,
  quantity,
  maxQuantity,
  isOutOfStock,
  isVariationRequired,
  hasUnavailableAttributes,
  unavailableAttributes,
  canAddToCart,
  isAddingToCart,
  isInWishlist,
  isInCompare,
  showMessage,
  isLoggedIn,
  currentVariant,
  attributeGroups,
  selectedColor,
  selectedSize,
  selectedAttributeValues,
  colorGroups,
  sizeGroups,
  onQuantityAdjust,
  onAddToCart,
  onAddToWishlist,
  onCompareToggle,
  onScrollToReviews,
  onColorSelect,
  onSizeSelect,
  onAttributeValueSelect,
  getOptionValue,
  getRequiredAttributesMessage,
}: ProductInfoAndActionsProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        {product.brand && (
          <div className="mb-2 flex items-center gap-2">
            {(product.brand.logo || product.brand.logoUrl) ? (
              <div className="relative h-5 w-5 overflow-hidden rounded-full border border-gray-200">
                <Image
                  src={product.brand.logo || product.brand.logoUrl || ''}
                  alt={product.brand.name}
                  fill
                  className="object-cover"
                  sizes="20px"
                  unoptimized
                />
              </div>
            ) : null}
            <p className="text-sm text-gray-500">{product.brand.name}</p>
          </div>
        )}
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {getProductText(language, product.id, 'title') || product.title}
        </h1>
        <ProductRatingSummary
          averageRating={averageRating}
          reviewsCount={reviewsCount}
          onReviewsClick={onScrollToReviews}
          language={language}
        />
        <div className="mb-6">
          <div className="flex flex-col gap-1">
            {/* Discounted price with discount percentage */}
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold text-gray-900">{formatPrice(price, currency as CurrencyCode)}</p>
              {discountPercent && discountPercent > 0 && (
                <span className="text-lg font-semibold text-blue-600">
                  -{discountPercent}%
                </span>
              )}
            </div>
            {/* Original price below discounted price - full width, not inline */}
            {(originalPrice || (compareAtPrice && compareAtPrice > price)) && (
              <p className="text-xl text-gray-500 line-through decoration-gray-400 mt-1">
                {formatPrice(originalPrice || compareAtPrice || 0, currency as CurrencyCode)}
              </p>
            )}
          </div>
        </div>
        <div className="text-gray-600 mb-8 prose prose-sm" dangerouslySetInnerHTML={{ __html: sanitizeHtml(getProductText(language, product.id, 'longDescription') || product.description || '') }} />

        {/* Attributes Section */}
        <div className="mb-8">
          <ProductAttributesSelector
            product={product}
            attributeGroups={attributeGroups}
            selectedColor={selectedColor}
            selectedSize={selectedSize}
            selectedAttributeValues={selectedAttributeValues}
            unavailableAttributes={unavailableAttributes}
            colorGroups={colorGroups}
            sizeGroups={sizeGroups}
            language={language}
            quantity={quantity}
            maxQuantity={maxQuantity}
            isOutOfStock={isOutOfStock}
            isVariationRequired={isVariationRequired}
            hasUnavailableAttributes={hasUnavailableAttributes}
            canAddToCart={canAddToCart}
            isAddingToCart={isAddingToCart}
            showMessage={showMessage}
            onColorSelect={onColorSelect}
            onSizeSelect={onSizeSelect}
            onAttributeValueSelect={onAttributeValueSelect}
            onQuantityAdjust={onQuantityAdjust}
            onAddToCart={onAddToCart}
            getOptionValue={getOptionValue}
            getRequiredAttributesMessage={getRequiredAttributesMessage}
          />
        </div>
      </div>
      
      {/* Action Buttons - Aligned with bottom of image */}
      <div className="mt-auto pt-6">
        {/* Show required attributes message if needed */}
        {isVariationRequired && (
          <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 font-medium">
              {getRequiredAttributesMessage()}
            </p>
          </div>
        )}
        {/* Show unavailable attributes message if needed */}
        {hasUnavailableAttributes && !isVariationRequired && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-medium">
              {Array.from(unavailableAttributes.entries()).map(([attrKey]) => {
                const productAttr = product?.productAttributes?.find((pa: any) => pa.attribute?.key === attrKey);
                const attributeName = productAttr?.attribute?.name || attrKey.charAt(0).toUpperCase() + attrKey.slice(1);
                return attrKey === 'color' ? t(language, 'product.color') : 
                       attrKey === 'size' ? t(language, 'product.size') : 
                       attributeName;
              }).join(', ')} {t(language, 'product.outOfStock')}
            </p>
          </div>
        )}
        <div className="flex items-center gap-3 pt-4 border-t">
          <div className="flex items-center border rounded-xl overflow-hidden bg-gray-50">
            <button 
              onClick={() => onQuantityAdjust(-1)} 
              disabled={quantity <= 1}
              className="w-12 h-12 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              -
            </button>
            <div className="w-12 text-center font-bold">{quantity}</div>
            <button 
              onClick={() => onQuantityAdjust(1)} 
              disabled={quantity >= maxQuantity}
              className="w-12 h-12 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
          <button 
            disabled={!canAddToCart || isAddingToCart} 
            className="flex-1 h-12 bg-gray-900 text-white rounded-xl uppercase font-bold disabled:bg-gray-300 disabled:cursor-not-allowed"
            onClick={onAddToCart}
          >
            {isAddingToCart ? t(language, 'product.adding') : (isOutOfStock ? t(language, 'product.outOfStock') : (isVariationRequired ? getRequiredAttributesMessage() : (hasUnavailableAttributes ? t(language, 'product.outOfStock') : t(language, 'product.addToCart'))))}
          </button>
          <button 
            onClick={onCompareToggle} 
            className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all duration-200 ${isInCompare ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <CompareIcon isActive={isInCompare} />
          </button>
          <button 
            onClick={onAddToWishlist} 
            className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center ${isInWishlist ? 'border-gray-900 bg-gray-50' : 'border-gray-200'}`}
          >
            <Heart fill={isInWishlist ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
      {showMessage && <div className="mt-4 p-4 bg-gray-900 text-white rounded-md shadow-lg">{showMessage}</div>}
    </div>
  );
}



