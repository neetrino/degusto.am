'use client';

import type { MouseEvent } from 'react';
import { Heart, Minus, Plus } from 'lucide-react';
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
    <div className="flex w-full max-w-full flex-col self-start p-4 sm:p-5 lg:p-6">
      <div className="-translate-x-[30px] flex min-h-0 flex-col">
        <div>
          {product.brand && (
            <div className="mb-3 flex items-center gap-2">
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
          <h1 className="mb-2 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
            {getProductText(language, product.id, 'title') || product.title}
          </h1>
          <ProductRatingSummary
            averageRating={averageRating}
            reviewsCount={reviewsCount}
            onReviewsClick={onScrollToReviews}
            language={language}
          />
          <div className="mb-6 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold text-gray-900">{formatPrice(price, currency as CurrencyCode)}</p>
              {discountPercent && discountPercent > 0 && (
                <span className="text-lg font-semibold text-blue-600">
                  -{discountPercent}%
                </span>
              )}
            </div>
            {(originalPrice || (compareAtPrice && compareAtPrice > price)) && (
              <p className="mt-1 text-xl text-gray-500 line-through decoration-gray-400">
                {formatPrice(originalPrice || compareAtPrice || 0, currency as CurrencyCode)}
              </p>
            )}
          </div>
          <div
            className="mb-4 prose prose-sm text-gray-600"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(getProductText(language, product.id, 'longDescription') || product.description || ''),
            }}
          />

          <div className="mb-4">
            <ProductAttributesSelector
              product={product}
              currentVariant={currentVariant}
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

        <div className="mt-[50px] pt-4">
        {isVariationRequired && (
          <div className="mb-3 rounded-lg bg-yellow-50 p-3">
            <p className="text-sm text-yellow-800 font-medium">
              {getRequiredAttributesMessage()}
            </p>
          </div>
        )}
        {hasUnavailableAttributes && !isVariationRequired && (
          <div className="mb-3 rounded-lg bg-red-50 p-3">
            <p className="text-sm text-red-800 font-medium">
              {Array.from(unavailableAttributes.entries()).map(([attrKey]) => {
                const productAttr = product?.productAttributes?.find((pa: unknown) => {
                  if (typeof pa !== 'object' || pa === null) {
                    return false;
                  }
                  const candidate = pa as { attribute?: { key?: string } };
                  return candidate.attribute?.key === attrKey;
                });
                const attributeName = productAttr?.attribute?.name || attrKey.charAt(0).toUpperCase() + attrKey.slice(1);
                return attrKey === 'color' ? t(language, 'product.color') : 
                       attrKey === 'size' ? t(language, 'product.size') : 
                       attributeName;
              }).join(', ')} {t(language, 'product.outOfStock')}
            </p>
          </div>
        )}
        <div className="flex items-center gap-3">
          <div
            className="inline-flex h-12 shrink-0 items-center gap-0.5 rounded-[15px] border border-neutral-200 bg-white px-1.5"
            role="group"
            aria-label={t(language, 'common.messages.quantity')}
          >
            <button
              type="button"
              onClick={() => onQuantityAdjust(-1)}
              disabled={quantity <= 1}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:pointer-events-none disabled:opacity-35"
              aria-label={t(language, 'common.ariaLabels.decreaseQuantity')}
            >
              <Minus className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            </button>
            <span className="min-w-[2.25rem] select-none text-center text-sm font-semibold tabular-nums text-neutral-900">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => onQuantityAdjust(1)}
              disabled={quantity >= maxQuantity}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:pointer-events-none disabled:opacity-35"
              aria-label={t(language, 'common.ariaLabels.increaseQuantity')}
            >
              <Plus className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            </button>
          </div>
          <button
            type="button"
            disabled={!canAddToCart || isAddingToCart}
            className="h-12 flex-1 rounded-xl bg-orange-500 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
            onClick={onAddToCart}
          >
            {isAddingToCart ? t(language, 'product.adding') : (isOutOfStock ? t(language, 'product.outOfStock') : (isVariationRequired ? getRequiredAttributesMessage() : (hasUnavailableAttributes ? t(language, 'product.outOfStock') : t(language, 'product.addToCart'))))}
          </button>
          <button
            onClick={onCompareToggle}
            type="button"
            className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-200 ${isInCompare ? 'bg-neutral-200 text-gray-900' : 'bg-neutral-100 hover:bg-neutral-200'}`}
          >
            <CompareIcon isActive={isInCompare} />
          </button>
          <button
            onClick={onAddToWishlist}
            type="button"
            className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${isInWishlist ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-neutral-100 text-gray-700 hover:bg-neutral-200'}`}
          >
            <Heart fill={isInWishlist ? 'currentColor' : 'none'} />
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}



