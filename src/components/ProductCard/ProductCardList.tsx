'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { KeyboardEvent, MouseEvent } from 'react';
import { formatPrice } from '../../lib/currency';
import { useTranslation } from '../../lib/i18n-client';
import { CompareIcon } from '../icons/CompareIcon';
import { WishlistHeartIcon } from '../icons/WishlistHeartIcon';
import { ProductColors } from './ProductColors';
import type { CurrencyCode } from '../../lib/currency';
import type { ProductLabel } from '../ProductLabels';
import {
  FIGMA_PRODUCT_CARD_CREAM_GROUP_HOVER_CLASS,
  FIGMA_PRODUCT_CARD_CREAM_HOVER_CLASS,
} from '@/constants/mobile-figma-storefront';
import { STOREFRONT_PRODUCT_IMAGE_PATH } from '@/constants/storefront-product-image';

interface ProductCardListProps {
  product: {
    id: string;
    slug: string;
    title: string;
    price: number;
    image: string | null;
    inStock: boolean;
    brand: { id: string; name: string; logoUrl?: string | null } | null;
    labels?: ProductLabel[];
    compareAtPrice?: number | null;
    originalPrice?: number | null;
    discountPercent?: number | null;
    colors?: Array<{ value: string; imageUrl?: string | null; colors?: string[] | null }>;
  };
  currency: CurrencyCode;
  isInWishlist: boolean;
  isInCompare: boolean;
  isAddingToCart: boolean;
  isUpdatingQuantity: boolean;
  cartQuantity: number;
  imageError: boolean;
  onImageError: () => void;
  onWishlistToggle: (e: MouseEvent) => void;
  onCompareToggle: (e: MouseEvent) => void;
  onAddToCart: (e: MouseEvent) => void;
  onDecreaseCart: (e: MouseEvent) => void;
  onProductClick: () => void;
  onPrefetchNavigate?: () => void;
}

/**
 * List view layout for ProductCard
 */
export function ProductCardList({
  product,
  currency,
  isInWishlist,
  isInCompare,
  isAddingToCart,
  isUpdatingQuantity,
  cartQuantity,
  imageError,
  onImageError,
  onWishlistToggle,
  onCompareToggle,
  onAddToCart,
  onDecreaseCart,
  onProductClick,
  onPrefetchNavigate,
}: ProductCardListProps) {
  const { t } = useTranslation();
  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    onProductClick();
  };

  return (
    <div
      data-product-card
      className={`bg-white rounded-lg border border-gray-200 overflow-hidden transition-colors ${FIGMA_PRODUCT_CARD_CREAM_HOVER_CLASS} group cursor-pointer`}
      onClick={onProductClick}
      onMouseEnter={onPrefetchNavigate}
      onFocus={onPrefetchNavigate}
      onKeyDown={handleCardKeyDown}
      role="link"
      tabIndex={0}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 px-4 sm:px-6 py-4">
        {/* Product Image */}
        <Link
          href={`/products/${product.slug}`}
          data-product-fly-origin
          className={`w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 relative overflow-hidden self-start sm:self-center transition-colors ${FIGMA_PRODUCT_CARD_CREAM_GROUP_HOVER_CLASS}`}
        >
          <Image
              src={STOREFRONT_PRODUCT_IMAGE_PATH}
              alt={product.title}
              fill
              className="object-cover"
              sizes="80px"
              unoptimized
              onError={onImageError}
            />
        </Link>

        {/* Product Info */}
        <div className="flex-1 min-w-0 w-full sm:w-auto">
          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="text-lg sm:text-xl font-medium text-gray-900 hover:text-blue-600 transition-colors line-clamp-2">
              {product.title}
            </h3>
            {product.brand?.logoUrl ? (
              <div className="mt-1">
                <div className="relative h-6 w-6">
                  <Image
                    src={product.brand.logoUrl}
                    alt={product.brand?.name || 'Brand logo'}
                    fill
                    className="object-contain"
                    sizes="24px"
                    unoptimized
                  />
                </div>
              </div>
            ) : null}
          </Link>
          {/* Available Colors */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <ProductColors colors={product.colors} maxVisible={6} />
            </div>
          )}
        </div>

        {/* Price and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
          {/* Price */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl sm:text-2xl font-semibold text-blue-600">
                {formatPrice(product.price || 0, currency)}
              </span>
              {product.discountPercent && product.discountPercent > 0 ? (
                <span className="text-xs sm:text-sm font-semibold text-blue-600">
                  -{product.discountPercent}%
                </span>
              ) : null}
            </div>
            {(product.originalPrice && product.originalPrice > product.price) || 
             (product.compareAtPrice && product.compareAtPrice > product.price) ? (
              <span className="text-base sm:text-lg text-gray-500 line-through mt-0.5">
                {formatPrice(
                  (product.originalPrice && product.originalPrice > product.price) 
                    ? product.originalPrice 
                    : (product.compareAtPrice || 0), 
                  currency
                )}
              </span>
            ) : null}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            {/* Compare Icon */}
            <button
              onClick={onCompareToggle}
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                isInCompare
                  ? 'border-gray-900 text-gray-900 bg-white shadow-sm'
                  : 'border-gray-200 text-gray-700 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
              title={isInCompare ? t('common.messages.removedFromCompare') : t('common.messages.addedToCompare')}
              aria-label={isInCompare ? t('common.messages.removedFromCompare') : t('common.messages.addedToCompare')}
            >
              <CompareIcon isActive={isInCompare} />
            </button>

            {/* Wishlist Icon */}
            <button
              onClick={onWishlistToggle}
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                isInWishlist
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={isInWishlist ? t('common.messages.removedFromWishlist') : t('common.messages.addedToWishlist')}
              aria-label={isInWishlist ? t('common.messages.removedFromWishlist') : t('common.messages.addedToWishlist')}
            >
              <WishlistHeartIcon filled={isInWishlist} size={20} />
            </button>

            {/* Cart Quantity Controls */}
            <div className="inline-flex items-center gap-2">
              <button
                onClick={onDecreaseCart}
                disabled={cartQuantity <= 0 || isUpdatingQuantity || isAddingToCart}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                title={t('common.ariaLabels.decreaseQuantity')}
                aria-label={t('common.ariaLabels.decreaseQuantity')}
              >
                -
              </button>
              <span className="inline-flex h-10 min-w-[3rem] items-center justify-center rounded-lg border border-gray-300 px-3 text-sm font-semibold text-gray-900">
                {cartQuantity}
              </span>
              <button
                onClick={onAddToCart}
                disabled={!product.inStock || isAddingToCart || isUpdatingQuantity}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                title={product.inStock ? t('common.ariaLabels.increaseQuantity') : t('common.ariaLabels.outOfStock')}
                aria-label={product.inStock ? t('common.ariaLabels.increaseQuantity') : t('common.ariaLabels.outOfStock')}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




