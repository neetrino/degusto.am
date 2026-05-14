'use client';

import { Minus, Plus } from 'lucide-react';
import Image from 'next/image';
import { formatPrice, type CurrencyCode } from '../../../lib/currency';
import { t, getProductText } from '../../../lib/i18n';
import type { LanguageCode } from '../../../lib/language';
import { sanitizeHtml } from '../../../lib/utils/sanitize';
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
  unavailableAttributes: Map<string, boolean>;
  canAddToCart: boolean;
  isAddingToCart: boolean;
  currentVariant: ProductVariant | null;
  attributeGroups: Map<string, any[]>;
  selectedColor: string | null;
  selectedSize: string | null;
  selectedAttributeValues: Map<string, string>;
  colorGroups: Array<{ color: string; stock: number; variants: ProductVariant[] }>;
  sizeGroups: Array<{ size: string; stock: number; variants: ProductVariant[] }>;
  onQuantityAdjust: (delta: number) => void;
  onAddToCart: () => Promise<void>;
  onScrollToReviews: () => void;
  onColorSelect: (color: string) => void;
  onSizeSelect: (size: string) => void;
  onAttributeValueSelect: (attrKey: string, value: string) => void;
  getOptionValue: (options: any[] | undefined, key: string) => string | null;
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
  unavailableAttributes,
  canAddToCart,
  isAddingToCart,
  currentVariant,
  attributeGroups,
  selectedColor,
  selectedSize,
  selectedAttributeValues,
  colorGroups,
  sizeGroups,
  onQuantityAdjust,
  onAddToCart,
  onScrollToReviews,
  onColorSelect,
  onSizeSelect,
  onAttributeValueSelect,
  getOptionValue,
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
              onColorSelect={onColorSelect}
              onSizeSelect={onSizeSelect}
              onAttributeValueSelect={onAttributeValueSelect}
              getOptionValue={getOptionValue}
            />
          </div>
        </div>

        <div className="mt-[50px] pt-4">
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
            {isAddingToCart ? t(language, 'product.adding') : (isOutOfStock ? t(language, 'product.outOfStock') : t(language, 'product.addToCart'))}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}



