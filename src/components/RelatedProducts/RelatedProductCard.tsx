'use client';

import { ProductPageLink } from '@/components/products/ProductPageLink';
import Image from 'next/image';
import type { MouseEvent } from 'react';
import { formatPrice } from '../../lib/currency';
import type { CurrencyCode } from '../../lib/currency';
import type { LanguageCode } from '../../lib/language';
import { logger } from '@/lib/utils/logger';
import { useAddToCart } from '../hooks/useAddToCart';
import { FIGMA_PRODUCT_CARD_CREAM_GROUP_HOVER_CLASS } from '@/constants/mobile-figma-storefront';
import { PRODUCT_CARD_CART_BTN_HOVER_CLASS } from '@/constants/product-card-action-hover';
import { resolveStorefrontProductImage } from '@/constants/storefront-product-image';
import { montserratArmFont } from '@/fonts/montserrat-arm-font';
import {
  PDP_RELATED_CARD_DISCOUNT_BADGE_CLASS,
  PDP_RELATED_CARD_DISCOUNT_BADGE_COMPACT_CLASS,
  PDP_RELATED_CARD_IMAGE_TOP_CLASS,
  PDP_RELATED_CARD_PRICE_BLOCK_CLASS,
  PDP_RELATED_CARD_PRICE_COLUMN_CLASS,
} from '@/constants/pdp-figma-tokens';
import { resolveStorefrontDiscountPercent } from '@/lib/storefront/discount-percent';
import { t } from '../../lib/i18n';
import { createProductPreviewSummary } from '@/lib/products/product-preview';
import { RatingStars } from '@/components/RatingStars';

const FIGMA_HOT_ICON = '/api/r2/product/20260512-dWv7-ZfxP1.svg';
const FIGMA_RIBBON_ICON = '/api/r2/product/20260512-lmzrYlGD39.svg';
const FIGMA_STAR_ICON = '/api/r2/product/20260512-7jf6Wihrew.svg';
const FIGMA_ADD_TO_CART_ICON = '/api/r2/product/20260512-g67zkm13ZH.svg';

interface RelatedProduct {
  id: string;
  slug: string;
  title: string;
  price: number;
  originalPrice?: number | null;
  compareAtPrice: number | null;
  discountPercent?: number | null;
  defaultVariantId?: string | null;
  image: string | null;
  inStock: boolean;
  rating?: number | null;
  categories?: Array<{
    id: string;
    slug: string;
    title: string;
  }>;
}

interface RelatedProductCardProps {
  product: RelatedProduct;
  currency: CurrencyCode;
  language: LanguageCode;
  hasMoved: boolean;
  onImageError: (productId: string) => void;
  imageError: boolean;
  width?: string;
  /** Two-up mobile carousel: fluid width, compact Figma card. */
  compact?: boolean;
}

const COMPACT_RELATED_CARD_HEIGHT_CLASS = 'min-h-[268px]';
const COMPACT_RELATED_CARD_IMAGE_HEIGHT_CLASS = 'h-[130px]';

function resolveCategoryLabel(product: RelatedProduct): string {
  return product.categories?.[0]?.title ?? '';
}

function resolveComparePrice(product: RelatedProduct): number | null {
  if (product.originalPrice && product.originalPrice > product.price) {
    return product.originalPrice;
  }
  if (product.compareAtPrice && product.compareAtPrice > product.price) {
    return product.compareAtPrice;
  }
  return null;
}

/**
 * Single product card component for RelatedProducts carousel (Figma node 1:634 / 10:1983).
 */
export function RelatedProductCard({
  product,
  currency,
  language,
  hasMoved,
  onImageError,
  imageError,
  width,
  compact = false,
}: RelatedProductCardProps) {
  const imageSrc = imageError
    ? resolveStorefrontProductImage(null)
    : resolveStorefrontProductImage(product.image);
  const categoryLabel = resolveCategoryLabel(product);
  const comparePrice = resolveComparePrice(product);
  const resolvedDiscountPercent = resolveStorefrontDiscountPercent({
    price: product.price,
    originalPrice: product.originalPrice,
    compareAtPrice: comparePrice,
    productDiscount: product.discountPercent,
  });
  const showDiscountBadge =
    resolvedDiscountPercent != null && resolvedDiscountPercent > 0;
  const discountText = showDiscountBadge ? `-${resolvedDiscountPercent}%` : '';
  const displayRating = product.rating ?? 5;
  const cardFontClass = montserratArmFont.className;
  const { isAddingToCart, addToCart } = useAddToCart({
    productId: product.id,
    productSlug: product.slug,
    inStock: product.inStock,
    defaultVariantId: product.defaultVariantId ?? undefined,
    price: product.price,
  });

  const handleAddToCart = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const button = event.currentTarget as HTMLElement;
    const cardRoot = button.closest('[data-related-product-card]');
    const origin =
      (cardRoot?.querySelector('[data-product-fly-origin]') as HTMLElement | null) ?? button;
    void addToCart({ origin, imageUrl: imageSrc });
  };
  const previewSummary = createProductPreviewSummary({
    id: product.id,
    slug: product.slug,
    title: product.title,
    image: imageSrc,
    price: product.price,
    oldPrice: comparePrice,
    discount: resolvedDiscountPercent,
    category: categoryLabel ? { slug: `preview-${product.id}`, title: categoryLabel } : null,
    rating: product.rating ?? 5,
    currency,
    inStock: product.inStock,
    defaultVariantId: product.defaultVariantId ?? null,
  });

  return (
    <div
      className={compact ? 'flex-shrink-0 px-[7px] pb-5' : 'flex-shrink-0 px-[16.5px] pb-[30px]'}
      style={{ width }}
    >
      <div data-related-product-card className="group relative flex h-full flex-col items-center py-[7px]">
        <ProductPageLink
          slug={product.slug}
          preview={previewSummary}
          className={
            compact
              ? 'flex w-full flex-1 cursor-pointer flex-col'
              : 'flex w-[236px] flex-1 cursor-pointer flex-col'
          }
          onClick={(e) => {
            if (hasMoved) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            logger.debug('[RelatedProducts] Navigating to product:', product.slug);
          }}
        >
          {compact ? (
            <div
              className={`relative mx-auto flex w-full max-w-[236px] ${COMPACT_RELATED_CARD_HEIGHT_CLASS} flex-col overflow-hidden rounded-[20px] border-[1.5px] border-[#dedede] bg-white transition-colors ${FIGMA_PRODUCT_CARD_CREAM_GROUP_HOVER_CLASS}`}
            >
              <div className="relative shrink-0 px-1.5 pt-1.5">
                <div
                  data-product-fly-origin
                  className={`relative w-full ${COMPACT_RELATED_CARD_IMAGE_HEIGHT_CLASS} overflow-hidden rounded-[18px] bg-gray-100`}
                >
                  <Image
                    src={imageSrc}
                    alt={product.title}
                    fill
                    className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 1024px) 50vw, 227px"
                    loading="lazy"
                    onError={() => onImageError(product.id)}
                  />
                </div>
                <div className="absolute left-4 top-4 flex size-8 items-center justify-center rounded-full bg-[#ff2b2e] p-1">
                  <img
                    src={FIGMA_HOT_ICON}
                    alt=""
                    className="size-[19px] -rotate-[13deg] object-contain"
                  />
                </div>
                <div className="absolute left-4 top-[52px] flex size-8 items-center justify-center overflow-hidden rounded-full">
                  <img src={FIGMA_RIBBON_ICON} alt="" className="size-8 scale-110 object-cover" />
                </div>
              </div>

              <div
                className={`flex min-h-0 flex-1 items-stretch justify-between gap-2 px-3 pb-3 pt-2 ${cardFontClass}`}
              >
                <div className="flex min-w-0 flex-1 flex-col self-stretch">
                  <div className="mb-1 flex items-center gap-1.5">
                    <RatingStars
                      rating={displayRating / 5}
                      starSrc={FIGMA_STAR_ICON}
                      className="flex items-center"
                      starClassName="size-4"
                      maxStars={1}
                    />
                    <p className="text-sm font-medium leading-none text-[rgba(60,47,47,0.62)]">
                      {displayRating.toFixed(1)}
                    </p>
                  </div>
                  <h3 className="text-sm font-bold leading-snug text-[#3c2f2f]">
                    <span className="line-clamp-2">{product.title}</span>
                  </h3>
                  {categoryLabel ? (
                    <p className="mt-auto mb-3 truncate pt-1 text-sm font-normal leading-none text-[#a1a1a1]">
                      {categoryLabel}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-col items-end self-stretch text-right">
                  {showDiscountBadge ? (
                    <span className={PDP_RELATED_CARD_DISCOUNT_BADGE_COMPACT_CLASS}>{discountText}</span>
                  ) : null}
                  <div className="mt-auto flex flex-col items-end">
                    <p className="whitespace-nowrap text-sm font-black leading-none tabular-nums text-[#3c2f2f]">
                      {formatPrice(product.price, currency)}
                    </p>
                    {comparePrice !== null ? (
                      <p className="mt-0.5 whitespace-nowrap text-xs font-light leading-none tabular-nums text-[#3c2f2f] line-through">
                        {formatPrice(comparePrice, currency)}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ) : (
          <div
            className={`relative h-[284px] w-[236px] rounded-[20px] border-[1.5px] border-[#dedede] bg-white transition-colors ${FIGMA_PRODUCT_CARD_CREAM_GROUP_HOVER_CLASS}`}
          >
            <div
              data-product-fly-origin
              className={`absolute left-1/2 ${PDP_RELATED_CARD_IMAGE_TOP_CLASS} h-[147px] w-[227px] -translate-x-1/2 overflow-hidden rounded-[18px] bg-gray-100`}
            >
              <Image
                src={imageSrc}
                alt={product.title}
                fill
                className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
                sizes="227px"
                loading="lazy"
                onError={() => onImageError(product.id)}
              />
            </div>

            <div className="absolute left-4 top-5 flex size-8 items-center justify-center rounded-full bg-[#ff2b2e] p-1">
              <img
                src={FIGMA_HOT_ICON}
                alt=""
                className="size-[19px] -rotate-[13deg] object-contain"
              />
            </div>
            <div className="absolute left-4 top-[58px] flex size-8 items-center justify-center overflow-hidden rounded-full">
              <img src={FIGMA_RIBBON_ICON} alt="" className="size-8 scale-110 object-cover" />
            </div>

            <div
              className={`absolute left-[14px] top-[170px] flex h-[90px] w-[209px] items-start justify-between ${cardFontClass}`}
            >
              <div className="w-[120px] shrink-0">
                <div className="mb-[5px] flex items-center gap-1.5">
                  <RatingStars
                    rating={displayRating / 5}
                    starSrc={FIGMA_STAR_ICON}
                    className="flex items-center"
                    starClassName="size-5"
                    maxStars={1}
                  />
                  <p className="text-base font-medium leading-[1.35] text-[rgba(60,47,47,0.62)]">
                    {displayRating.toFixed(1)}
                  </p>
                </div>
                <h3 className="text-base font-bold leading-normal text-[#3c2f2f]">
                  <span className="line-clamp-2">{product.title}</span>
                </h3>
                {categoryLabel ? (
                  <p className="mt-[5px] truncate text-base font-normal leading-normal text-[#a1a1a1]">
                    {categoryLabel}
                  </p>
                ) : null}
              </div>

              <div className={PDP_RELATED_CARD_PRICE_COLUMN_CLASS}>
                {showDiscountBadge ? (
                  <span className={PDP_RELATED_CARD_DISCOUNT_BADGE_CLASS}>{discountText}</span>
                ) : null}
                <div className={PDP_RELATED_CARD_PRICE_BLOCK_CLASS}>
                  <p className="whitespace-nowrap text-[20px] font-black leading-none tabular-nums text-[#3c2f2f]">
                    {formatPrice(product.price, currency)}
                  </p>
                  {comparePrice !== null ? (
                    <p className="mt-1 whitespace-nowrap text-sm font-light leading-none tabular-nums text-[#3c2f2f] line-through">
                      {formatPrice(comparePrice, currency)}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
          )}
        </ProductPageLink>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!product.inStock || isAddingToCart}
          className={`absolute left-1/2 z-20 inline-flex -translate-x-1/2 items-center justify-center disabled:cursor-not-allowed disabled:opacity-50 ${PRODUCT_CARD_CART_BTN_HOVER_CLASS} ${
            compact
              ? '-bottom-[14px] size-[42px]'
              : '-bottom-[18px] h-[52px] w-[51px]'
          }`}
          title={
            product.inStock
              ? t(language, 'product.addToCart')
              : t(language, 'product.outOfStock')
          }
          aria-label={
            product.inStock
              ? t(language, 'product.addToCart')
              : t(language, 'product.outOfStock')
          }
        >
          <img
            src={FIGMA_ADD_TO_CART_ICON}
            alt=""
            className={compact ? 'size-[42px] object-contain' : 'h-[52px] w-[51px] object-contain'}
          />
        </button>
      </div>
    </div>
  );
}
