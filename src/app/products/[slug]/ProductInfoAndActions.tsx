'use client';

import { Minus, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, type MouseEvent } from 'react';
import { useWishlist } from '../../../components/hooks/useWishlist';
import { useAuth } from '../../../lib/auth/AuthContext';
import { montserratArmFont } from '../../../fonts/montserrat-arm-font';
import { formatPriceInCurrency, type CurrencyCode } from '../../../lib/currency';
import { t, getProductText } from '../../../lib/i18n';
import type { LanguageCode } from '../../../lib/language';
import { sanitizeHtml } from '../../../lib/utils/sanitize';
import { PdpActionHeartIcon } from './PdpActionHeartIcon';
import { PdpAnimatedPrice } from './PdpAnimatedPrice';
import { PdpCustomizationPills } from './PdpCustomizationPills';
import { PdpSecondaryIconButton } from './PdpSecondaryIconButton';
import { ProductAttributesSelector } from './ProductAttributesSelector';
import { ProductRatingSummary } from './ProductRatingSummary';
import {
  PDP_FIGMA_ORANGE,
  PDP_DESCRIPTION_CLASS,
  PDP_TITLE_CLASS,
  PDP_PRICE_CLASS,
  PDP_COMPARE_PRICE_CLASS,
  PDP_PRICE_ROW_CLASS,
  PDP_ADD_TO_CART_BUTTON_CLASS,
  PDP_QUANTITY_SELECTOR_CLASS,
  PDP_PILL_RADIUS_CLASS,
  PDP_ACTIONS_ROW_CLASS,
  PDP_ACTIONS_MOBILE_TOP_ROW_CLASS,
} from '@/constants/pdp-figma-tokens';
import { pdpProductToWishlistSnapshot } from '@/lib/wishlist/wishlist-product-snapshot-mappers';
import { resolveStorefrontProductImageFromMedia } from '@/constants/storefront-product-image';
import type { Product, ProductVariant, AttributeGroupValue, VariantOption } from './types';

interface ProductInfoAndActionsProps {
  product: Product;
  price: number;
  originalPrice: number | null;
  compareAtPrice: number | null;
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
  onQuantityAdjust: (delta: number) => void;
  onAddToCart: () => Promise<void>;
  onColorSelect: (color: string) => void;
  onSizeSelect: (size: string) => void;
  onAttributeValueSelect: (attrKey: string, value: string) => void;
  getOptionValue: (options: VariantOption[] | undefined, key: string) => string | null;
  hideSecondaryDetails?: boolean;
}

export function ProductInfoAndActions({
  product,
  price,
  originalPrice,
  compareAtPrice,
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
  onQuantityAdjust,
  onAddToCart,
  onColorSelect,
  onSizeSelect,
  onAttributeValueSelect,
  getOptionValue,
  hideSecondaryDetails = false,
}: ProductInfoAndActionsProps) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist(product.id);
  const localizedTitle = useMemo(
    () => getProductText(language, product.id, 'title') || product.title,
    [language, product.id, product.title]
  );
  const localizedDescription = useMemo(
    () => getProductText(language, product.id, 'longDescription') || product.description || '',
    [language, product.id, product.description]
  );
  const sanitizedDescription = useMemo(
    () => sanitizeHtml(localizedDescription),
    [localizedDescription]
  );

  const handleWishlistToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!isLoggedIn) {
      router.push(`/login?redirect=/products/${encodeURIComponent(product.slug)}`);
      return;
    }
    void toggleWishlist(
      pdpProductToWishlistSnapshot({
        id: product.id,
        slug: product.slug,
        title: localizedTitle,
        price,
        originalPrice,
        compareAtPrice,
        discountPercent:
          product.productDiscount ?? product.globalDiscount ?? currentVariant?.productDiscount ?? null,
        image: resolveStorefrontProductImageFromMedia(product.media),
        inStock: !isOutOfStock,
      })
    );
  };

  const comparePrice =
    originalPrice != null && originalPrice > price
      ? originalPrice
      : compareAtPrice != null && compareAtPrice > price
        ? compareAtPrice
        : null;

  const displayPrice = price * quantity;
  const displayComparePrice = comparePrice != null ? comparePrice * quantity : null;

  return (
    <div className="flex w-full max-w-full flex-col self-start max-lg:px-0 max-lg:py-0 lg:h-full lg:min-h-0 lg:justify-between lg:self-stretch lg:px-0 lg:py-0">
      <div>
          <h1 className={`${PDP_TITLE_CLASS} ${montserratArmFont.className}`}>
            {localizedTitle}
          </h1>
          <ProductRatingSummary
            averageRating={averageRating}
            reviewsCount={reviewsCount}
          />
          <div className={PDP_PRICE_ROW_CLASS}>
            <PdpAnimatedPrice
              amount={displayPrice}
              currency={currency as CurrencyCode}
              className={`${PDP_PRICE_CLASS} ${montserratArmFont.className}`}
            />
            {displayComparePrice != null ? (
              <span className={`${PDP_COMPARE_PRICE_CLASS} ${montserratArmFont.className}`}>
                {formatPriceInCurrency(displayComparePrice, currency as CurrencyCode)}
              </span>
            ) : null}
          </div>
          {!hideSecondaryDetails ? (
            <div
              className={PDP_DESCRIPTION_CLASS}
              dangerouslySetInnerHTML={{
                __html: sanitizedDescription,
              }}
            />
          ) : (
            <div className="h-6" aria-hidden />
          )}

          {!hideSecondaryDetails ? (
            <PdpCustomizationPills
              product={product}
              language={language}
              currency={currency as CurrencyCode}
              currentVariant={currentVariant}
              additions={additions}
              exclusions={exclusions}
              onAdditionsChange={onAdditionsChange}
              onExclusionsChange={onExclusionsChange}
            />
          ) : null}

          {!hideSecondaryDetails ? (
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
          ) : (
            <div className="mb-4 h-10" aria-hidden />
          )}
        </div>

      <div className="mt-6 pt-2 lg:mt-auto lg:pt-0">
          <div className={PDP_ACTIONS_ROW_CLASS}>
            <div className={PDP_ACTIONS_MOBILE_TOP_ROW_CLASS}>
              <div
                className={PDP_QUANTITY_SELECTOR_CLASS}
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
                  className="min-w-[1.75rem] select-none text-center text-lg font-medium tabular-nums"
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
                className={`${PDP_ADD_TO_CART_BUTTON_CLASS} ${PDP_PILL_RADIUS_CLASS} ${montserratArmFont.className}`}
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
                <span className={isInWishlist ? 'text-[#ff7f20]' : 'text-[#494949]'}>
                  <PdpActionHeartIcon />
                </span>
              </PdpSecondaryIconButton>
            </div>
          </div>
        </div>
    </div>
  );
}
