'use client';

import type { MouseEvent } from 'react';
import { ProductCardImage } from './ProductCardImage';
import { ProductCardInfo } from './ProductCardInfo';
import { ProductCardActions } from './ProductCardActions';
import { usePrefetchProductWhenVisible } from '../hooks/usePrefetchProductWhenVisible';
import { ProductCardOverlayLink } from './ProductCardOverlayLink';
import { WishlistHeartIcon } from '../icons/WishlistHeartIcon';
import { useTranslation } from '../../lib/i18n-client';
import type { CurrencyCode } from '../../lib/currency';
import type { ProductLabel } from '../ProductLabels';
import {
  FIGMA_PRODUCT_CARD_CREAM_GROUP_HOVER_CLASS,
  FIGMA_PRODUCT_CARD_CREAM_HOVER_CLASS,
} from '@/constants/mobile-figma-storefront';

interface ProductCardGridProps {
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
  isCompact?: boolean;
  onImageError: () => void;
  onWishlistToggle: (e: MouseEvent) => void;
  onCompareToggle: (e: MouseEvent) => void;
  onAddToCart: (e: MouseEvent) => void;
  onDecreaseCart: (e: MouseEvent) => void;
  productHref: string;
  onPrefetchNavigate?: () => void;
}

/**
 * Grid view layout for ProductCard
 */
export function ProductCardGrid({
  product,
  currency,
  isInWishlist,
  isInCompare,
  isAddingToCart,
  isUpdatingQuantity,
  cartQuantity,
  imageError,
  isCompact = false,
  onImageError,
  onWishlistToggle,
  onCompareToggle,
  onAddToCart,
  onDecreaseCart,
  productHref,
  onPrefetchNavigate,
}: ProductCardGridProps) {
  const { t } = useTranslation();
  const visibilityRef = usePrefetchProductWhenVisible(product.slug);
  const wishlistButtonSize = isCompact ? 'w-10 h-10' : 'w-12 h-12';
  const wishlistIconSize = isCompact ? 18 : 20;

  return (
    <div
      ref={visibilityRef}
      data-product-card
      className={`relative overflow-hidden rounded-lg border border-gray-200 bg-white transition-colors ${FIGMA_PRODUCT_CARD_CREAM_HOVER_CLASS} group cursor-pointer hover:shadow-md`}
      onMouseEnter={onPrefetchNavigate}
      onFocus={onPrefetchNavigate}
    >
      <ProductCardOverlayLink slug={product.slug} label={product.title} />
      {/* Product Image */}
      <div
        className={`relative aspect-square overflow-hidden bg-gray-100 transition-colors ${FIGMA_PRODUCT_CARD_CREAM_GROUP_HOVER_CLASS}`}
      >
        <ProductCardImage
          image={product.image}
          title={product.title}
          labels={product.labels}
          imageError={imageError}
          onImageError={onImageError}
          isCompact={isCompact}
        />

        {/* Wishlist — always visible on image (touch + desktop) */}
        <button
          type="button"
          onClick={onWishlistToggle}
          className={`absolute ${isCompact ? 'top-1.5 right-1.5' : 'top-3 right-3'} z-20 ${wishlistButtonSize} rounded-full flex items-center justify-center transition-all duration-200 shadow-md ${
            isInWishlist
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-white/95 text-gray-700 hover:bg-white border border-gray-200/80'
          }`}
          title={
            isInWishlist ? t('common.messages.removedFromWishlist') : t('common.messages.addedToWishlist')
          }
          aria-label={
            isInWishlist ? t('common.ariaLabels.removeFromWishlist') : t('common.ariaLabels.addToWishlist')
          }
        >
          <WishlistHeartIcon filled={isInWishlist} size={wishlistIconSize} />
        </button>

        {/* Compare — on hover (wishlist is fixed above) */}
        <ProductCardActions
          isInWishlist={isInWishlist}
          isInCompare={isInCompare}
          isAddingToCart={isAddingToCart}
          inStock={product.inStock}
          isCompact={isCompact}
          onWishlistToggle={onWishlistToggle}
          onCompareToggle={onCompareToggle}
          onAddToCart={onAddToCart}
          showOnHover
          showWishlist={false}
        />
      </div>

      <div className="relative z-10">
      {/* Product Info */}
      <ProductCardInfo
        title={product.title}
        brandName={product.brand?.name}
        brandLogoUrl={product.brand?.logoUrl}
        price={product.price}
        originalPrice={product.originalPrice}
        compareAtPrice={product.compareAtPrice}
        discountPercent={product.discountPercent}
        currency={currency}
        colors={product.colors}
        isCompact={isCompact}
      />

      {/* Quantity Controls in Price Row */}
      <div className={`px-4 pb-4 flex items-center justify-end ${isCompact ? 'gap-2' : 'gap-4'}`}>
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
  );
}

