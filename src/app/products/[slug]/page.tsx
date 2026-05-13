'use client';

import Link from 'next/link';
import { useLayoutEffect } from 'react';
import { apiClient } from '../../../lib/api-client';
import { t } from '../../../lib/i18n';
import { useAuth } from '../../../lib/auth/AuthContext';
import { RelatedProducts } from '../../../components/RelatedProducts';
import { ProductReviews } from '../../../components/ProductReviews';
import { ProductImageGallery } from './ProductImageGallery';
import { ProductInfoAndActions } from './ProductInfoAndActions';
import { ProductPageShell } from './ProductPageShell';
import { useProductPage } from './useProductPage';
import { playCartFlyAnimation } from '../../../lib/cart-fly-animation';
import { BodyBackground } from '../../../components/BodyBackground';
import { ProjectGreenStripes } from '../../../components/decor/ProjectGreenStripes';
import { logger } from '@/lib/utils/logger';
import {
  buildCustomizationLineKey,
  normalizeProductCustomizations,
} from '../../../lib/cart/customizations';
import type { ProductPageProps } from './types';

/** White behind header on PDP so the UniversalHeader spacer matches the chrome, not orange. */
const PDP_BODY_BACKGROUND = '#ffffff';
/** Pull orange shell under the fixed header stack (104px spacer) like login layout. */
const PDP_HEADER_UNDERLAP_CLASS = 'relative z-10 -mt-[104px] pt-[104px]';

export default function ProductPage({ params }: ProductPageProps) {
  const { isLoggedIn } = useAuth();
  const {
    product,
    loading,
    notFound,
    images,
    currentImageIndex,
    setCurrentImageIndex,
    thumbnailStartIndex,
    setThumbnailStartIndex,
    currency,
    language,
    selectedColor,
    selectedSize,
    selectedAttributeValues,
    isAddingToCart,
    setIsAddingToCart,
    additions,
    exclusions,
    setAdditions,
    setExclusions,
    isInWishlist,
    isInCompare,
    quantity,
    reviews,
    averageRating,
    slug,
    attributeGroups,
    colorGroups,
    sizeGroups,
    currentVariant,
    price,
    originalPrice,
    compareAtPrice,
    discountPercent,
    maxQuantity,
    isOutOfStock,
    isVariationRequired,
    hasUnavailableAttributes,
    unavailableAttributes,
    canAddToCart,
    scrollToReviews,
    getOptionValue,
    adjustQuantity,
    handleColorSelect,
    handleSizeSelect,
    handleAttributeValueSelect,
    handleAddToWishlist,
    handleCompareToggle,
    getRequiredAttributesMessage,
  } = useProductPage(params);

  /**
   * Single layout pass before paint when full PDP data is committed (no progressive subtree).
   */
  useLayoutEffect(() => {
    if (!product) return;
    window.scrollTo(0, 0);
  }, [product?.id]);

  const handleAddToCart = async () => {
    if (!canAddToCart || !product || !currentVariant) return;
    const customizations = normalizeProductCustomizations({ additions, exclusions });
    const flyOrigin = document.querySelector('[data-product-fly-origin]');
    const imageUrl = images[currentImageIndex] ?? images[0] ?? null;
    playCartFlyAnimation({
      fromElement: flyOrigin,
      imageUrl,
    });
    setIsAddingToCart(true);
    try {
      if (!isLoggedIn) {
        const stored = localStorage.getItem('shop_cart_guest');
        const cart = stored ? JSON.parse(stored) : [];
        const lineId = buildCustomizationLineKey(currentVariant.id, customizations);
        const existing = cart.find(
          (
            i: unknown
          ): i is {
            variantId: string;
            quantity: number;
            lineId?: string;
            productId?: string;
            productSlug?: string;
          } =>
            typeof i === 'object' &&
            i !== null &&
            'variantId' in i &&
            'lineId' in i &&
            i.variantId === currentVariant.id &&
            i.lineId === lineId
        );
        if (existing) existing.quantity += quantity;
        else {
          cart.push({
            lineId,
            productId: product.id,
            productSlug: product.slug,
            variantId: currentVariant.id,
            quantity,
            customizations,
          });
        }
        localStorage.setItem('shop_cart_guest', JSON.stringify(cart));
      } else {
        await apiClient.post('/api/v1/cart/items', {
          productId: product.id,
          variantId: currentVariant.id,
          quantity,
          customizations,
        });
      }
      window.dispatchEvent(new Event('cart-updated'));
    } catch (error: unknown) {
      logger.warn('Add to cart failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (loading && !product) {
    return (
      <>
        <BodyBackground color={PDP_BODY_BACKGROUND} />
        <div className={PDP_HEADER_UNDERLAP_CLASS}>
          <ProductPageShell />
        </div>
      </>
    );
  }

  if (notFound && !product) {
    return (
      <>
        <BodyBackground color={PDP_BODY_BACKGROUND} />
        <div className={PDP_HEADER_UNDERLAP_CLASS}>
          <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
            <p className="text-lg text-neutral-600">{t(language, 'common.messages.noProductsFound')}</p>
            <Link
              href="/shop"
              className="inline-flex h-10 items-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-50"
            >
              {t(language, 'common.navigation.products')}
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <BodyBackground color={PDP_BODY_BACKGROUND} />
        <div className={PDP_HEADER_UNDERLAP_CLASS}>
          <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
            <p className="text-lg text-neutral-600">{t(language, 'common.messages.invalidProduct')}</p>
            <Link
              href="/shop"
              className="inline-flex h-10 items-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-50"
            >
              {t(language, 'common.navigation.products')}
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <BodyBackground color={PDP_BODY_BACKGROUND} />
      <div
        className={`${PDP_HEADER_UNDERLAP_CLASS} min-h-dvh overflow-x-hidden bg-[var(--project-color)]`}
      >
        <ProjectGreenStripes extendFirstStrokeUp />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-white">
            <Link href="/shop" className="text-white/90 transition-colors hover:text-white">
              {t(language, 'common.navigation.products')}
            </Link>
            <span aria-hidden className="text-white/70">
              /
            </span>
            <span className="line-clamp-1 font-medium text-white">
              {product.title}
            </span>
          </nav>

          <section className="rounded-3xl border border-neutral-200 bg-white p-4 sm:p-6 lg:p-8 shadow-[0_8px_28px_rgba(0,0,0,0.06)]">
            <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-10 lg:gap-12 items-start">
            <ProductImageGallery
              images={images}
              product={product}
              discountPercent={discountPercent}
              language={language}
              currentImageIndex={currentImageIndex}
              onImageIndexChange={setCurrentImageIndex}
              thumbnailStartIndex={thumbnailStartIndex}
              onThumbnailStartIndexChange={setThumbnailStartIndex}
              mainImagePriority={currentImageIndex === 0}
            />

            <ProductInfoAndActions
              product={product}
              price={price}
              originalPrice={originalPrice}
              compareAtPrice={compareAtPrice}
              discountPercent={discountPercent}
              currency={currency}
              language={language}
              averageRating={averageRating}
              reviewsCount={reviews.length}
              quantity={quantity}
              maxQuantity={maxQuantity}
              isOutOfStock={isOutOfStock}
              isVariationRequired={isVariationRequired}
              hasUnavailableAttributes={hasUnavailableAttributes}
              unavailableAttributes={unavailableAttributes}
              canAddToCart={canAddToCart}
              isAddingToCart={isAddingToCart}
              isInWishlist={isInWishlist}
              isInCompare={isInCompare}
              isLoggedIn={isLoggedIn}
              currentVariant={currentVariant}
              attributeGroups={attributeGroups}
              selectedColor={selectedColor}
              selectedSize={selectedSize}
              selectedAttributeValues={selectedAttributeValues}
              colorGroups={colorGroups}
              sizeGroups={sizeGroups}
              onQuantityAdjust={adjustQuantity}
              onAddToCart={handleAddToCart}
              onAddToWishlist={handleAddToWishlist}
              onCompareToggle={handleCompareToggle}
              onScrollToReviews={scrollToReviews}
              onColorSelect={handleColorSelect}
              onSizeSelect={handleSizeSelect}
              onAttributeValueSelect={handleAttributeValueSelect}
              getOptionValue={getOptionValue}
              getRequiredAttributesMessage={getRequiredAttributesMessage}
            />
          </div>
          </section>

          <div className="mt-16 rounded-3xl border border-neutral-200 bg-white p-4 sm:p-6 lg:p-8 shadow-[0_6px_22px_rgba(0,0,0,0.04)]">
            <RelatedProducts
              productSlug={slug}
              categorySlug={product.categories?.[0]?.slug}
              currentProductId={product.id}
            />
          </div>

          <div
            id="product-reviews"
            className="mt-10 rounded-3xl border border-neutral-200 bg-white p-4 sm:p-6 lg:p-8 scroll-mt-24 shadow-[0_6px_22px_rgba(0,0,0,0.04)]"
          >
            <ProductReviews productSlug={slug} productId={product.id} />
          </div>
        </div>
      </div>
    </>
  );
}
