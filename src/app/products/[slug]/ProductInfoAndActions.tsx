'use client';

import { Minus, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';
import { useWishlist } from '../../../components/hooks/useWishlist';
import { WishlistHeartIcon } from '../../../components/icons/WishlistHeartIcon';
import { useAuth } from '../../../lib/auth/AuthContext';
import { formatPrice, type CurrencyCode } from '../../../lib/currency';
import { t, getProductText } from '../../../lib/i18n';
import type { LanguageCode } from '../../../lib/language';
import { sanitizeHtml } from '../../../lib/utils/sanitize';
import { PdpCustomizationPills } from './PdpCustomizationPills';
import { PdpSecondaryIconButton } from './PdpSecondaryIconButton';
import { ProductAttributesSelector } from './ProductAttributesSelector';
import { ProductRatingSummary } from './ProductRatingSummary';
import {
  PDP_FIGMA_ORANGE,
  PDP_FIGMA_TEXT,
  PDP_DESCRIPTION_CLASS,
  PDP_PRICE_CLASS,
  PDP_PILL_RADIUS_CLASS,
} from '@/constants/pdp-figma-tokens';
import type { Product, ProductVariant, AttributeGroupValue, VariantOption } from './types';

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
  attributeGroups: Map<string, AttributeGroupValue[]>;
  selectedColor: string | null;
  selectedSize: string | null;
  selectedAttributeValues: Map<string, string>;
  colorGroups: Array<{ color: string; stock: number; variants: ProductVariant[] }>;
  sizeGroups: Array<{ size: string; stock: number; variants: ProductVariant[] }>;
  additions: string;
  exclusions: string;
  onAdditionsChange: (value: string) => void;
  onExclusionsChange: (value: string) => void;
  onResetOptions: () => void;
  onQuantityAdjust: (delta: number) => void;
  onAddToCart: () => Promise<void>;
  onScrollToReviews: () => void;
  onColorSelect: (color: string) => void;
  onSizeSelect: (size: string) => void;
  onAttributeValueSelect: (attrKey: string, value: string) => void;
  getOptionValue: (options: VariantOption[] | undefined, key: string) => string | null;
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
  additions,
  exclusions,
  onAdditionsChange,
  onExclusionsChange,
  onResetOptions,
  onQuantityAdjust,
  onAddToCart,
  onScrollToReviews,
  onColorSelect,
  onSizeSelect,
  onAttributeValueSelect,
  getOptionValue,
}: ProductInfoAndActionsProps) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist(product.id);

  const handleWishlistToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!isLoggedIn) {
      router.push(`/login?redirect=/products/${encodeURIComponent(product.slug)}`);
      return;
    }
    void toggleWishlist();
  };

  return (
    <div className="flex w-full max-w-full flex-col self-start max-lg:px-0 max-lg:py-0 lg:px-0 lg:py-0">
      <div className="flex min-h-0 flex-col">
        <div>
          {product.brand ? (
            <div className="mb-3 flex items-center gap-2">
              {product.brand.logo || product.brand.logoUrl ? (
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
              <p className="text-sm text-[#868686]">{product.brand.name}</p>
            </div>
          ) : null}
          <h1
            className="mb-2 text-[28px] font-bold leading-tight sm:text-[32px] lg:text-[36px]"
            style={{ color: PDP_FIGMA_TEXT }}
          >
            {getProductText(language, product.id, 'title') || product.title}
          </h1>
          <ProductRatingSummary
            averageRating={averageRating}
            reviewsCount={reviewsCount}
            onReviewsClick={onScrollToReviews}
            language={language}
          />
          <p className={PDP_PRICE_CLASS}>
            {formatPrice(price, currency as CurrencyCode)}
            {discountPercent && discountPercent > 0 ? (
              <span className="ml-3 text-lg font-semibold" style={{ color: PDP_FIGMA_ORANGE }}>
                -{discountPercent}%
              </span>
            ) : null}
          </p>
          {originalPrice || (compareAtPrice && compareAtPrice > price) ? (
            <p className="-mt-2 mb-4 text-lg leading-normal line-through text-[#3c2f2f]">
              {formatPrice(originalPrice || compareAtPrice || 0, currency as CurrencyCode)}
            </p>
          ) : null}
          <div
            className={PDP_DESCRIPTION_CLASS}
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(
                getProductText(language, product.id, 'longDescription') || product.description || ''
              ),
            }}
          />

          <PdpCustomizationPills
            language={language}
            additions={additions}
            exclusions={exclusions}
            onAdditionsChange={onAdditionsChange}
            onExclusionsChange={onExclusionsChange}
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

        <div className="mt-6 pt-2 lg:mt-8">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div
              className={`inline-flex h-12 shrink-0 items-center gap-1 border-2 bg-white px-1 ${PDP_PILL_RADIUS_CLASS}`}
              style={{ borderColor: PDP_FIGMA_ORANGE }}
              role="group"
              aria-label={t(language, 'common.messages.quantity')}
            >
              <button
                type="button"
                onClick={() => onQuantityAdjust(-1)}
                disabled={quantity <= 1}
                className="flex h-8 w-8 shrink-0 items-center justify-center disabled:pointer-events-none disabled:opacity-35"
                style={{ color: PDP_FIGMA_ORANGE }}
                aria-label={t(language, 'common.ariaLabels.decreaseQuantity')}
              >
                <Minus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
              </button>
              <span
                className="min-w-[1.75rem] select-none px-1 text-center text-lg font-medium tabular-nums"
                style={{ color: PDP_FIGMA_ORANGE }}
              >
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => onQuantityAdjust(1)}
                disabled={quantity >= maxQuantity}
                className="flex h-8 w-8 shrink-0 items-center justify-center disabled:pointer-events-none disabled:opacity-35"
                style={{ color: PDP_FIGMA_ORANGE }}
                aria-label={t(language, 'common.ariaLabels.increaseQuantity')}
              >
                <Plus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
              </button>
            </div>
            <button
              type="button"
              disabled={!canAddToCart || isAddingToCart}
              className={`h-12 flex-1 px-6 text-base font-medium text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500 ${PDP_PILL_RADIUS_CLASS}`}
              style={{ backgroundColor: canAddToCart && !isAddingToCart ? PDP_FIGMA_ORANGE : undefined }}
              onClick={onAddToCart}
            >
              {isAddingToCart
                ? t(language, 'product.adding')
                : isOutOfStock
                  ? t(language, 'product.outOfStock')
                  : t(language, 'product.addToCart')}
            </button>
            <PdpSecondaryIconButton
              onClick={handleWishlistToggle}
              aria-label={
                isInWishlist
                  ? t(language, 'common.ariaLabels.removeFromWishlist')
                  : t(language, 'common.ariaLabels.addToWishlist')
              }
              title={
                isInWishlist
                  ? t(language, 'common.messages.removedFromWishlist')
                  : t(language, 'common.messages.addedToWishlist')
              }
            >
              <span className={isInWishlist ? 'text-[#ff7f20]' : 'text-[#3c2f2f]'}>
                <WishlistHeartIcon filled={isInWishlist} size={29} />
              </span>
            </PdpSecondaryIconButton>
            <PdpSecondaryIconButton
              onClick={onResetOptions}
              aria-label={t(language, 'product.resetOptionsAria')}
              title={t(language, 'product.resetOptionsAria')}
            >
              <Trash2 className="h-[30px] w-[30px] text-[#3c2f2f]" strokeWidth={1.75} aria-hidden />
            </PdpSecondaryIconButton>
          </div>
        </div>
      </div>
    </div>
  );
}
