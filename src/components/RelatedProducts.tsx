'use client';

import { useState, useEffect, useMemo } from 'react';
import { getStoredCurrency } from '../lib/currency';
import { getStoredLanguage, type LanguageCode } from '../lib/language';
import { t } from '../lib/i18n';
import { useRelatedProducts } from './hooks/useRelatedProducts';
import { useLazyInView } from './hooks/useLazyInView';
import { useCarousel } from './hooks/useCarousel';
import { useVisibleCards } from './hooks/useVisibleCards';
import { RelatedProductCard } from './RelatedProducts/RelatedProductCard';
import { CarouselNavigation } from './RelatedProducts/CarouselNavigation';
import { CarouselDots } from './RelatedProducts/CarouselDots';
import { ViewMoreButton } from './view-more/ViewMoreButton';
import { mirageExpandedFont } from '@/fonts/mirage-expanded-font';
import { montserratArmFont } from '@/fonts/montserrat-arm-font';
import {
  PDP_FIGMA_DARK_SECTION,
  PDP_RELATED_CARDS_GAP_CLASS,
  PDP_RELATED_CAROUSEL_DOTS_CLASS,
  PDP_RELATED_HEADER_GAP_CLASS,
  PDP_RELATED_SECTION_CLASS,
  PDP_RELATED_SECTION_MAX_WIDTH_CLASS,
  PDP_RELATED_TITLE_ACCENT_CLASS,
  PDP_RELATED_TITLE_MAIN_CLASS,
  PDP_RELATED_VIEW_MORE_CLASS,
} from '@/constants/pdp-figma-tokens';
import type { RelatedCardPayload } from '@/lib/services/products-slug/product-related-transform';

interface RelatedProductsProps {
  categorySlug?: string;
  currentProductId: string;
  /** PDP: use dedicated related endpoint + cache (server resolves category). */
  productSlug?: string;
  initialProducts?: RelatedCardPayload[];
  initialLanguage?: LanguageCode;
}

/**
 * RelatedProducts component - displays products from the same category in a carousel
 * Shown at the bottom of the single product page
 */
export function RelatedProducts({
  categorySlug,
  currentProductId,
  productSlug,
  initialProducts,
  initialLanguage,
}: RelatedProductsProps) {
  const [language, setLanguage] = useState<LanguageCode>(initialLanguage ?? 'en');
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
    initialProducts,
    initialLanguage,
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
    () => (visibleCards <= 2 ? 2 : visibleCards),
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

  const currency = getStoredCurrency();
  const handleImageError = (productId: string) => {
    setImageErrors((prev) => new Set(prev).add(productId));
  };

  const showOffscreenPlaceholder = !inView && products.length === 0;

  return (
    <section
      ref={lazyRef}
      className={PDP_RELATED_SECTION_CLASS}
      style={{ backgroundColor: PDP_FIGMA_DARK_SECTION }}
    >
      <div className={PDP_RELATED_SECTION_MAX_WIDTH_CLASS}>
        <div className={`flex items-start justify-between gap-4 ${PDP_RELATED_HEADER_GAP_CLASS}`}>
          <h2
            className={`max-w-[min(100%,42rem)] font-black leading-none${
              language === 'hy' ? ` ${mirageExpandedFont.className}` : ''
            }`}
          >
            <span className={PDP_RELATED_TITLE_ACCENT_CLASS}>
              {t(language, 'product.relatedSectionTitleAccent')}
            </span>
            <span className={PDP_RELATED_TITLE_MAIN_CLASS}>
              {t(language, 'product.relatedSectionTitleMain')}
            </span>
          </h2>
          <ViewMoreButton
            href="/shop"
            className={`${PDP_RELATED_VIEW_MORE_CLASS} ${montserratArmFont.className} lg:mt-2`}
            size="md"
          >
            {t(language, 'product.relatedSectionMore')} →
          </ViewMoreButton>
        </div>

        {showOffscreenPlaceholder ? (
          <div
            className={`flex ${PDP_RELATED_CARDS_GAP_CLASS} lg:grid lg:grid-cols-4 xl:grid-cols-5`}
            aria-hidden
          >
            {Array.from({ length: loadingSkeletonCount }, (_, i) => i + 1).map((i) => (
              <div key={i} className="min-w-0 flex-1 lg:flex-none">
                <div className="h-[268px] rounded-[20px] bg-neutral-50 lg:h-[284px]" />
              </div>
            ))}
          </div>
        ) : loading && products.length === 0 ? (
          <div
            className={`flex ${PDP_RELATED_CARDS_GAP_CLASS} lg:grid lg:grid-cols-4 xl:grid-cols-5`}
            aria-busy="true"
          >
            {Array.from({ length: loadingSkeletonCount }, (_, i) => i + 1).map((i) => (
              <div key={i} className="min-w-0 flex-1 animate-pulse lg:flex-none">
                <div className="h-[268px] rounded-[20px] bg-neutral-100 lg:h-[284px]" />
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
                    hasMoved={hasMoved}
                    onImageError={handleImageError}
                    imageError={imageErrors.has(product.id)}
                    width={`${100 / visibleCards}%`}
                    compact={isCompactCarousel}
                  />
                ))}
              </div>
            </div>

            {products.length > visibleCards && (
              <CarouselNavigation
                language={language}
                onPrevious={goToPrevious}
                onNext={goToNext}
              />
            )}

            {products.length > visibleCards && (
              <div className={PDP_RELATED_CAROUSEL_DOTS_CLASS}>
                <CarouselDots
                  totalItems={products.length}
                  visibleItems={visibleCards}
                  currentIndex={currentIndex}
                  onDotClick={goToIndex}
                  scrollStep={scrollStep}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
