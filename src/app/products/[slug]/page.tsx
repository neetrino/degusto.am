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
import type { ProductPageProps } from './types';

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
    showMessage,
    setShowMessage,
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
        const existing = cart.find(
          (i: unknown): i is { variantId: string; quantity: number; productId?: string; productSlug?: string } =>
            typeof i === 'object' && i !== null && 'variantId' in i && i.variantId === currentVariant.id
        );
        if (existing) existing.quantity += quantity;
        else cart.push({ productId: product.id, productSlug: product.slug, variantId: currentVariant.id, quantity });
        localStorage.setItem('shop_cart_guest', JSON.stringify(cart));
      } else {
        await apiClient.post('/api/v1/cart/items', { productId: product.id, variantId: currentVariant.id, quantity });
      }
      setShowMessage(`${t(language, 'product.addedToCart')} ${quantity} ${t(language, 'product.pcs')}`);
      window.dispatchEvent(new Event('cart-updated'));
    } catch {
      setShowMessage(t(language, 'product.errorAddingToCart'));
    } finally {
      setIsAddingToCart(false);
      setTimeout(() => setShowMessage(null), 2000);
    }
  };

  if (loading && !product) {
    return <ProductPageShell />;
  }

  if (notFound && !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-lg text-neutral-600">{t(language, 'common.messages.noProductsFound')}</p>
        <Link href="/products" className="inline-block text-blue-600 font-medium hover:underline">
          {t(language, 'common.navigation.products')}
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-lg text-neutral-600">{t(language, 'common.messages.invalidProduct')}</p>
        <Link href="/products" className="inline-block text-blue-600 font-medium hover:underline">
          {t(language, 'common.navigation.products')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-12 items-start">
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
          showMessage={showMessage}
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

      <div className="mt-24">
        <RelatedProducts
          productSlug={slug}
          categorySlug={product.categories?.[0]?.slug}
          currentProductId={product.id}
        />
      </div>
      <div id="product-reviews" className="mt-16 scroll-mt-24">
        <ProductReviews productSlug={slug} productId={product.id} />
      </div>
    </div>
  );
}
