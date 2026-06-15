'use client';

import { ProductPageLink } from '@/components/products/ProductPageLink';
import Image from 'next/image';
import { resolveStorefrontProductImage } from '@/constants/storefront-product-image';
import { Button } from '@shop/ui';
import { formatPrice, type CurrencyCode } from '../../lib/currency';
import { WishlistMobileProductCard } from './WishlistMobileProductCard';
import { createProductPreviewSummary } from '@/lib/products/product-preview';

export interface WishlistProductCardProduct {
  id: string;
  slug: string;
  title: string;
  price: number;
  originalPrice: number | null;
  compareAtPrice: number | null;
  discountPercent: number | null;
  image: string | null;
  inStock: boolean;
}

export interface WishlistProductCardProps {
  product: WishlistProductCardProduct;
  currency: CurrencyCode;
  isQueueingAddToCart: boolean;
  isRecentlyAddedToCart: boolean;
  onRemove: (productId: string) => void;
  onAddToCart: (product: WishlistProductCardProduct) => void;
  t: (key: string) => string;
}

interface WishlistCardImageLinkProps {
  slug: string;
  title: string;
  image: string | null;
  preview: ReturnType<typeof createProductPreviewSummary>;
}

function WishlistCardImageLink({ slug, title, image, preview }: WishlistCardImageLinkProps) {
  return (
    <ProductPageLink
      slug={slug}
      preview={preview}
      className="absolute inset-0 block outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
    >
      <Image
        src={resolveStorefrontProductImage(image)}
        alt={title}
        fill
        className="object-cover transition-transform duration-500 ease-out group-hover/card:scale-[1.05]"
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
        unoptimized
      />
      <span
        className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-brand/35 via-brand/5 to-transparent opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
        aria-hidden
      />
    </ProductPageLink>
  );
}

interface WishlistCardRemoveProps {
  productId: string;
  removeLabel: string;
  onRemove: (productId: string) => void;
}

function WishlistCardRemove({ productId, removeLabel, onRemove }: WishlistCardRemoveProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onRemove(productId);
      }}
      className="absolute right-2.5 top-2.5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/80 bg-white/90 text-gray-500 shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:border-brand/40 hover:bg-brand/10 hover:text-brand hover:shadow-lg active:scale-95"
      aria-label={removeLabel}
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}

interface WishlistCardPriceRowProps {
  product: WishlistProductCardProduct;
  currency: CurrencyCode;
}

function WishlistCardPriceRow({ product, currency }: WishlistCardPriceRowProps) {
  const showOriginalStrike =
    product.originalPrice != null && product.originalPrice > product.price;
  const showCompareStrike =
    !showOriginalStrike &&
    product.compareAtPrice != null &&
    product.compareAtPrice > product.price;

  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className="text-xl font-bold tabular-nums text-gray-900">
        {formatPrice(product.price, currency)}
      </span>
      {product.discountPercent != null && product.discountPercent > 0 ? (
        <span className="rounded-md bg-brand/10 px-1.5 py-0.5 text-xs font-bold text-brand">
          -{product.discountPercent}%
        </span>
      ) : null}
      {showOriginalStrike && product.originalPrice != null ? (
        <span className="text-sm tabular-nums text-gray-400 line-through">
          {formatPrice(product.originalPrice, currency)}
        </span>
      ) : null}
      {showCompareStrike && product.compareAtPrice != null ? (
        <span className="text-sm tabular-nums text-gray-400 line-through">
          {formatPrice(product.compareAtPrice, currency)}
        </span>
      ) : null}
    </div>
  );
}

interface WishlistCardInfoPanelProps {
  product: WishlistProductCardProduct;
  currency: CurrencyCode;
  isQueueingAddToCart: boolean;
  isRecentlyAddedToCart: boolean;
  onAddToCart: (product: WishlistProductCardProduct) => void;
  t: (key: string) => string;
  preview: ReturnType<typeof createProductPreviewSummary>;
}

function WishlistCardInfoPanel({
  product,
  currency,
  isQueueingAddToCart,
  isRecentlyAddedToCart,
  onAddToCart,
  t,
  preview,
}: WishlistCardInfoPanelProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2.5 border-t border-brand/10 bg-white px-4 pb-4 pt-3">
      <ProductPageLink
        slug={product.slug}
        preview={preview}
        className="block rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
      >
        <h3 className="line-clamp-2 text-[0.9375rem] font-semibold leading-snug tracking-tight text-gray-900 transition-colors group-hover/card:text-brand">
          {product.title}
        </h3>
      </ProductPageLink>

      <WishlistCardPriceRow product={product} currency={currency} />

      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
            product.inStock
              ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/15'
              : 'bg-red-50 text-red-800 ring-1 ring-red-600/15'
          }`}
        >
          {product.inStock ? t('common.stock.inStock') : t('common.stock.outOfStock')}
        </span>
      </div>

      <div className="mt-auto border-t border-brand/10 pt-3">
        <Button
          variant="primary"
          className="w-full !bg-brand shadow-sm transition-shadow hover:!bg-brand-hover hover:shadow-md focus:!ring-brand"
          onClick={() => onAddToCart(product)}
          disabled={!product.inStock}
        >
          {isRecentlyAddedToCart ? t('common.messages.addedToCart') : t('common.buttons.addToCart')}
        </Button>
      </div>
    </div>
  );
}

/**
 * Product tile for the wishlist grid: image hover zoom, clear price/stock/footer CTA.
 */
export function WishlistProductCard({
  product,
  currency,
  isQueueingAddToCart,
  isRecentlyAddedToCart,
  onRemove,
  onAddToCart,
  t,
}: WishlistProductCardProps) {
  const image = resolveStorefrontProductImage(product.image);
  const oldPrice =
    product.originalPrice != null && product.originalPrice > product.price
      ? product.originalPrice
      : product.compareAtPrice != null && product.compareAtPrice > product.price
        ? product.compareAtPrice
        : null;
  const previewSummary = createProductPreviewSummary({
    id: product.id,
    slug: product.slug,
    title: product.title,
    image,
    price: product.price,
    oldPrice,
    discount: product.discountPercent,
    currency,
    inStock: product.inStock,
  });

  return (
    <>
      <div className="sm:hidden">
        <WishlistMobileProductCard
          product={product}
          currency={currency}
          isQueueingAddToCart={isQueueingAddToCart}
          isRecentlyAddedToCart={isRecentlyAddedToCart}
          onRemove={onRemove}
          onAddToCart={onAddToCart}
          t={t}
        />
      </div>
      <article className="group/card relative hidden flex-col overflow-hidden rounded-xl border border-gray-200/90 bg-white shadow-sm ring-1 ring-brand/5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-brand/25 hover:shadow-lg hover:ring-brand/15 sm:flex">
        <div className="relative aspect-square shrink-0 overflow-hidden bg-gradient-to-b from-brand/5 to-gray-100">
          <WishlistCardImageLink
            slug={product.slug}
            title={product.title}
            image={product.image}
            preview={previewSummary}
          />
          <WishlistCardRemove
            productId={product.id}
            removeLabel={t('common.ariaLabels.removeFromWishlist')}
            onRemove={onRemove}
          />
        </div>
        <WishlistCardInfoPanel
          product={product}
          currency={currency}
          isQueueingAddToCart={isQueueingAddToCart}
          isRecentlyAddedToCart={isRecentlyAddedToCart}
          onAddToCart={onAddToCart}
          t={t}
          preview={previewSummary}
        />
      </article>
    </>
  );
}
