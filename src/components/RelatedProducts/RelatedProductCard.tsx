'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { MouseEvent } from 'react';
import { formatPrice } from '../../lib/currency';
import type { CurrencyCode } from '../../lib/currency';
import type { LanguageCode } from '../../lib/language';
import { logger } from "@/lib/utils/logger";

const FIGMA_CARD_IMAGE = '/api/r2/product/20260512-D3w_teddze.png';
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
  image: string | null;
  inStock: boolean;
  brand?: {
    id: string;
    name: string;
  } | null;
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
  isAddingToCart: boolean;
  hasMoved: boolean;
  onAddToCart: (e: MouseEvent, product: RelatedProduct) => void;
  onImageError: (productId: string) => void;
  imageError: boolean;
  width: string;
}

/**
 * Single product card component for RelatedProducts carousel
 */
export function RelatedProductCard({
  product,
  currency,
  language,
  isAddingToCart,
  hasMoved,
  onAddToCart,
  onImageError,
  imageError,
  width,
}: RelatedProductCardProps) {
  const hasImage = product.image && !imageError;
  const hasDiscount = typeof product.discountPercent === 'number' && product.discountPercent > 0;
  const discountText = hasDiscount ? `-${Math.round(product.discountPercent!)}%` : '';

  return (
    <div
      className="flex-shrink-0 px-[15px] pb-[30px]"
      style={{ width }}
    >
      <div className="group relative h-full flex flex-col items-center">
        <Link
          href={`/products/${product.slug}`}
          className="block cursor-pointer flex-1 flex flex-col w-[236px]"
          onClick={(e) => {
            // Prevent navigation only if we actually dragged (moved more than threshold)
            if (hasMoved) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            logger.debug('[RelatedProducts] Navigating to product:', product.slug);
          }}
        >
          <div className="relative h-[284px] w-[236px] rounded-[20px] border-[1.5px] border-[#dedede] bg-white">
            <div className="absolute left-1/2 top-1 h-[147px] w-[227px] -translate-x-1/2 overflow-hidden rounded-[18px] bg-gray-100">
              <Image
                src={hasImage ? product.image! : FIGMA_CARD_IMAGE}
                alt={product.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="227px"
                unoptimized
                onError={() => onImageError(product.id)}
              />
            </div>

            <div className="absolute left-4 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-[#ff2b2e] p-1">
              <img src={FIGMA_HOT_ICON} alt="" className="h-[19px] w-[19px] -rotate-[13deg] object-contain" />
            </div>
            <div className="absolute left-4 top-[58px] flex h-8 w-8 items-center justify-center overflow-hidden rounded-full">
              <img src={FIGMA_RIBBON_ICON} alt="" className="h-8 w-8 scale-110 object-cover" />
            </div>

            <div className="absolute left-[14px] top-[170px] flex items-center gap-[6px]">
              <img src={FIGMA_STAR_ICON} alt="" className="h-5 w-5 object-contain" />
              <p className="text-base font-medium leading-[1.35] text-[rgba(60,47,47,0.62)]">4.7</p>
            </div>
            <div className="absolute left-[14px] top-[194px] w-[130px]">
              <h3 className="text-base font-bold leading-[1.05] text-[#3c2f2f]">
                <span className="block max-h-[34px] overflow-hidden break-words">{product.title}</span>
              </h3>
            </div>

            {hasDiscount ? (
              <span className="absolute right-px top-[170px] inline-flex h-[30px] items-center rounded-[60px] bg-[#ff7f20] px-[17px] text-sm font-bold leading-none text-black">
                {discountText}
              </span>
            ) : null}

            <div className="absolute right-[14px] top-[228px] flex max-w-[112px] flex-col items-end text-right">
              <p className="w-full whitespace-nowrap text-[20px] font-black leading-none tabular-nums text-[#3c2f2f]">
                {formatPrice(product.price, currency)}
              </p>
              {(product.originalPrice && product.originalPrice > product.price) || 
              (product.compareAtPrice && product.compareAtPrice > product.price) ? (
                <p className="mt-2 w-full translate-x-[8px] whitespace-nowrap text-sm font-light leading-none tabular-nums text-[#3c2f2f] line-through">
                  {formatPrice(
                    (product.originalPrice && product.originalPrice > product.price) 
                      ? product.originalPrice 
                      : (product.compareAtPrice || 0),
                    currency
                  )}
                </p>
              ) : null}
            </div>
          </div>
        </Link>

        {/* Cart Icon Button */}
        <button
          onClick={(e) => onAddToCart(e, product)}
          disabled={!product.inStock || isAddingToCart}
          className="absolute -bottom-[18px] left-1/2 inline-flex h-[52px] w-[51px] -translate-x-1/2 items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed z-20"
          title={product.inStock ? 'Add to cart' : 'Out of stock'}
          aria-label={product.inStock ? 'Add to cart' : 'Out of stock'}
        >
          {isAddingToCart ? (
            <svg className="animate-spin h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <img src={FIGMA_ADD_TO_CART_ICON} alt="" className="h-[52px] w-[51px] object-contain" />
          )}
        </button>
      </div>
    </div>
  );
}




