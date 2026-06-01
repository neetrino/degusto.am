'use client';

import { useState, useEffect, useMemo, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../lib/api-client';
import { getStoredCurrency } from '../lib/currency';
import { getStoredLanguage, type LanguageCode } from '../lib/language';
import { t } from '../lib/i18n';
import { logger } from '@/lib/utils/logger';
import { useAuth } from '../lib/auth/AuthContext';
import { useRelatedProducts } from './hooks/useRelatedProducts';
import { useLazyInView } from './hooks/useLazyInView';
import { useCarousel } from './hooks/useCarousel';
import { useVisibleCards } from './hooks/useVisibleCards';
import { RelatedProductCard } from './RelatedProducts/RelatedProductCard';
import { CarouselNavigation } from './RelatedProducts/CarouselNavigation';
import { CarouselDots } from './RelatedProducts/CarouselDots';
import { ViewMoreButton } from './view-more/ViewMoreButton';
import {
  PDP_FIGMA_DARK_SECTION,
  PDP_MAIN_RADIUS_CLASS,
} from '@/constants/pdp-figma-tokens';

interface RelatedProductsProps {
  categorySlug?: string;
  currentProductId: string;
  /** PDP: use dedicated related endpoint + cache (server resolves category). */
  productSlug?: string;
}

/**
 * RelatedProducts component - displays products from the same category in a carousel
 * Shown at the bottom of the single product page
 */
export function RelatedProducts({ categorySlug, currentProductId, productSlug }: RelatedProductsProps) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [addingToCart, setAddingToCart] = useState<Set<string>>(new Set());
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const visibleCards = useVisibleCards();
  /** One card per swipe; viewport still shows `visibleCards` (2 on mobile). */
  const scrollStep = 1;
  const isCompactCarousel = visibleCards === 2;
  const { ref: lazyRef, inView } = useLazyInView();

  const { products, loading } = useRelatedProducts({
    categorySlug,
    currentProductId,
    language,
    productSlug,
    enabled: inView,
  });

  const {
    currentIndex,
    isDragging,
    hasMoved,
    carouselRef,
    goToPrevious,
    goToNext,
    goToIndex,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleWheel,
  } = useCarousel({
    itemCount: products.length,
    visibleItems: visibleCards,
    scrollStep,
  });

  const loadingSkeletonCount = useMemo(
    () => (visibleCards === 2 ? 2 : 4),
    [visibleCards],
  );

  // Initialize language from localStorage after mount to prevent hydration mismatch
  useEffect(() => {
    setLanguage(getStoredLanguage());

    const handleLanguageUpdate = () => {
      setLanguage(getStoredLanguage());
    };

    window.addEventListener('language-updated', handleLanguageUpdate);
    return () => {
      window.removeEventListener('language-updated', handleLanguageUpdate);
    };
  }, []);

  /**
   * Handle adding product to cart
   */
  const handleAddToCart = async (e: MouseEvent, product: (typeof products)[0]) => {
    e.preventDefault();
    e.stopPropagation();

    if (!product.inStock) {
      return;
    }

    if (!isLoggedIn) {
      router.push(`/login?redirect=/products/${product.slug}`);
      return;
    }

    setAddingToCart((prev) => new Set(prev).add(product.id));

    try {
      interface ProductDetails {
        id: string;
        slug: string;
        variants?: Array<{
          id: string;
          sku: string;
          price: number;
          stock: number;
          available: boolean;
        }>;
      }

      const encodedSlug = encodeURIComponent(product.slug.trim());
      const productDetails = await apiClient.get<ProductDetails>(`/api/v1/products/${encodedSlug}`);

      if (!productDetails.variants || productDetails.variants.length === 0) {
        alert('No variants available');
        return;
      }

      const variantId = productDetails.variants[0].id;

      await apiClient.post('/api/v1/cart/items', {
        productId: product.id,
        variantId: variantId,
        quantity: 1,
      });

      window.dispatchEvent(new Event('cart-updated'));
    } catch (error: unknown) {
      logger.warn('[RelatedProducts] Error adding to cart', {
        error: error instanceof Error ? error.message : String(error),
      });
      const err = error as { message?: string };
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        router.push(`/login?redirect=/products/${product.slug}`);
      } else {
        alert('Failed to add product to cart. Please try again.');
      }
    } finally {
      setAddingToCart((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }
  };

  const currency = getStoredCurrency();
  const handleImageError = (productId: string) => {
    setImageErrors((prev) => new Set(prev).add(productId));
  };

  return (
    <section
      ref={lazyRef}
      className={`px-4 py-10 sm:px-8 sm:py-12 lg:px-[82px] lg:py-[77px] ${PDP_MAIN_RADIUS_CLASS}`}
      style={{ backgroundColor: PDP_FIGMA_DARK_SECTION }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-start justify-between gap-4 sm:mb-10">
          <h2 className="max-w-[min(100%,720px)] font-black leading-none">
            <span className="text-[32px] text-[#f66913] sm:text-[48px] lg:text-[60px]">
              {t(language, 'home.figma.desktop.specialOffersTitleAccent')}
            </span>
            <span className="text-[32px] text-white sm:text-[48px] lg:text-[60px]">
              {t(language, 'home.figma.desktop.specialOffersTitleMain')}
            </span>
          </h2>
          <ViewMoreButton href="/shop" className="mt-2 shrink-0" size="md">
            {t(language, 'home.figma.desktop.moreButton')} →
          </ViewMoreButton>
        </div>

        {!inView ? (
          <div
            className="flex gap-3 lg:grid lg:grid-cols-4 lg:gap-[30px]"
            aria-hidden
          >
            {Array.from({ length: loadingSkeletonCount }, (_, i) => i + 1).map((i) => (
              <div key={i} className="min-w-0 flex-1 lg:flex-none">
                <div className="h-[240px] rounded-[20px] bg-neutral-50 lg:h-[284px]" />
              </div>
            ))}
          </div>
        ) : loading ? (
          <div
            className="flex gap-3 lg:grid lg:grid-cols-4 lg:gap-[30px]"
            aria-busy="true"
          >
            {Array.from({ length: loadingSkeletonCount }, (_, i) => i + 1).map((i) => (
              <div key={i} className="min-w-0 flex-1 animate-pulse lg:flex-none">
                <div className="h-[240px] rounded-[20px] bg-neutral-100 lg:h-[284px]" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-lg text-neutral-400">{t(language, 'product.noRelatedProducts')}</p>
          </div>
        ) : (
          <div className="relative pb-2">
            <div
              ref={carouselRef}
              className="relative cursor-grab touch-pan-y select-none overflow-hidden active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onWheel={handleWheel}
            >
              <div
                className="flex items-stretch"
                style={{
                  transform: `translateX(-${currentIndex * (100 / visibleCards)}%)`,
                  transition: isDragging ? 'none' : 'transform 0.5s ease-in-out',
                }}
              >
                {products.map((product) => (
                  <RelatedProductCard
                    key={product.id}
                    product={product}
                    currency={currency}
                    language={language}
                    isAddingToCart={addingToCart.has(product.id)}
                    hasMoved={hasMoved}
                    onAddToCart={handleAddToCart}
                    onImageError={handleImageError}
                    imageError={imageErrors.has(product.id)}
                    width={`${100 / visibleCards}%`}
                    compact={isCompactCarousel}
                  />
                ))}
              </div>
            </div>

            {products.length > visibleCards && (
              <CarouselNavigation onPrevious={goToPrevious} onNext={goToNext} />
            )}

            {products.length > visibleCards && (
              <CarouselDots
                totalItems={products.length}
                visibleItems={visibleCards}
                currentIndex={currentIndex}
                onDotClick={goToIndex}
                scrollStep={scrollStep}
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}
