'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { getStoredCurrency, HYDRATION_SAFE_CURRENCY } from '../lib/currency';
import { useLanguage } from '../lib/i18n-client';
import { t } from '../lib/i18n';
import type { LanguageCode } from '../lib/language';
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
  PDP_RELATED_CAROUSEL_DOT_ACTIVE_CLASS,
  PDP_RELATED_CAROUSEL_DOT_INACTIVE_CLASS,
  PDP_RELATED_CAROUSEL_DOTS_CLASS,
  PDP_RELATED_HEADER_GAP_CLASS,
  PDP_RELATED_SECTION_CLASS,
  PDP_RELATED_SECTION_MAX_WIDTH_CLASS,
  PDP_RELATED_TITLE_ACCENT_CLASS,
  PDP_RELATED_TITLE_MAIN_CLASS,
  PDP_RELATED_VIEW_MORE_CLASS,
} from '@/constants/pdp-figma-tokens';
import type { RelatedCardPayload } from '@/lib/services/products-slug/product-related-transform';
import {
  getRelatedProductsSnapshot,
  getRelatedProductsPool,
  seedRelatedProductsPool,
  setRelatedProductsSnapshot,
} from '@/lib/products/related-products-cache';
import { useHasMounted } from '@/hooks/useHasMounted';
import { forEachValidShopMenuProductsCacheEntry } from '@/lib/shop/shop-menu-products-cache';
import type { MenuCard } from '@/components/home/menu-types';

function mapMenuCardToRelatedCard(card: MenuCard): RelatedCardPayload {
  const compareAtPrice = card.oldPrice > card.price ? card.oldPrice : null;
  return {
    id: card.id,
    slug: card.slug,
    title: card.title || card.slug,
    price: card.price,
    originalPrice: compareAtPrice,
    compareAtPrice,
    discountPercent: card.discountPercent ?? null,
    defaultVariantId: card.defaultVariantId ?? null,
    image: card.image ?? null,
    inStock: card.inStock ?? true,
    rating: card.rating ?? 5,
    categories:
      card.categorySlug || card.category
        ? [
            {
              id: card.categorySlug || card.category || 'uncategorized',
              slug: card.categorySlug || '',
              title: card.category || '',
            },
          ]
        : [],
  };
}

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
  const hasMounted = useHasMounted();
  const cachedSnapshot =
    productSlug != null
      ? getRelatedProductsSnapshot(productSlug)
      : null;
  const pooledProducts = useMemo(
    () =>
      getRelatedProductsPool({
        excludeProductId: currentProductId,
        excludeSlug: productSlug,
        limit: 8,
      }),
    [currentProductId, productSlug]
  );
  const menuCacheProducts = useMemo(() => {
    const cards: RelatedCardPayload[] = [];
    forEachValidShopMenuProductsCacheEntry((_, data) => {
      for (const card of data.cards) {
        cards.push(mapMenuCardToRelatedCard(card));
      }
    });
    return cards;
  }, []);

  useEffect(() => {
    if (menuCacheProducts.length === 0) {
      return;
    }
    seedRelatedProductsPool(menuCacheProducts);
  }, [menuCacheProducts]);

  const cacheFirstProducts = useMemo(
    () => (pooledProducts.length > 0 ? pooledProducts : menuCacheProducts),
    [menuCacheProducts, pooledProducts]
  );
  const effectiveInitialProducts =
    initialProducts && initialProducts.length > 0
      ? initialProducts
      : cachedSnapshot?.products ?? cacheFirstProducts;
  const effectiveInitialLanguage =
    initialLanguage ?? cachedSnapshot?.language;

  const language = useLanguage();
  const [currency, setCurrency] = useState(HYDRATION_SAFE_CURRENCY);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const initialRevealedCount = useMemo(
    () => Math.min(5, effectiveInitialProducts?.length ?? 0),
    [effectiveInitialProducts]
  );
  const [revealedCount, setRevealedCount] = useState(initialRevealedCount);

  useEffect(() => {
    if (!productSlug || !effectiveInitialProducts || effectiveInitialProducts.length === 0) {
      return;
    }
    seedRelatedProductsPool(effectiveInitialProducts);
    setRelatedProductsSnapshot(productSlug, effectiveInitialLanguage ?? 'en', effectiveInitialProducts);
  }, [effectiveInitialLanguage, effectiveInitialProducts, productSlug]);

  const visibleCards = useVisibleCards();
  /** One card per swipe; viewport still shows `visibleCards` (2 on mobile). */
  const scrollStep = 1;
  const isCompactCarousel = visibleCards === 2;
  const hasInitialProducts = (effectiveInitialProducts?.length ?? 0) > 0;
  const { ref: lazyRef, inView } = useLazyInView(hasInitialProducts ? '0px' : undefined);

  const { products, loading } = useRelatedProducts({
    categorySlug,
    currentProductId,
    language,
    productSlug,
    enabled: hasInitialProducts || inView,
    initialProducts: effectiveInitialProducts,
    initialLanguage: effectiveInitialLanguage,
  });
  const displayedProducts = useMemo(
    () => products.slice(0, revealedCount),
    [products, revealedCount]
  );

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
    itemCount: displayedProducts.length,
    visibleItems: visibleCards,
    scrollStep,
  });

  const loadingSkeletonCount = useMemo(
    () => (visibleCards <= 2 ? 2 : visibleCards),
    [visibleCards],
  );
  const skeletonCardWidth = `${100 / visibleCards}%`;

  useEffect(() => {
    if (products.length === 0) {
      setRevealedCount(0);
      return;
    }
    setRevealedCount((prev) => {
      const initialBatch = Math.min(5, products.length);
      if (prev === 0) {
        return initialBatch;
      }
      return Math.min(prev, products.length);
    });
  }, [products]);

  useEffect(() => {
    if (revealedCount >= products.length || products.length === 0) {
      return;
    }
    const timer = setTimeout(() => {
      setRevealedCount((prev) => Math.min(prev + 1, products.length));
    }, 1000);
    return () => clearTimeout(timer);
  }, [products.length, revealedCount]);

  useEffect(() => {
    if (!hasMounted) {
      return;
    }
    const handleCurrencyUpdate = () => {
      setCurrency(getStoredCurrency());
    };
    handleCurrencyUpdate();
    window.addEventListener('currency-updated', handleCurrencyUpdate);
    window.addEventListener('currency-rates-updated', handleCurrencyUpdate);
    return () => {
      window.removeEventListener('currency-updated', handleCurrencyUpdate);
      window.removeEventListener('currency-rates-updated', handleCurrencyUpdate);
    };
  }, [hasMounted]);

  const handleImageError = useCallback((productId: string) => {
    setImageErrors((prev) => new Set(prev).add(productId));
  }, []);

  const showOffscreenPlaceholder =
    !hasInitialProducts && !inView && products.length === 0;

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
          <div className="relative overflow-hidden" aria-hidden>
            <div className="flex items-stretch">
              {Array.from({ length: loadingSkeletonCount }, (_, i) => i + 1).map((i) => (
                <div key={i} className="shrink-0" style={{ width: skeletonCardWidth }}>
                  <div className={isCompactCarousel ? 'px-[7px] pb-5' : 'px-[16.5px] pb-[30px]'}>
                    <div className="h-[268px] rounded-[20px] bg-neutral-50 lg:h-[284px]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : loading && products.length === 0 ? (
          <div className="relative overflow-hidden" aria-busy="true">
            <div className="flex items-stretch">
              {Array.from({ length: loadingSkeletonCount }, (_, i) => i + 1).map((i) => (
                <div key={i} className="shrink-0" style={{ width: skeletonCardWidth }}>
                  <div
                    className={`${isCompactCarousel ? 'px-[7px] pb-5' : 'px-[16.5px] pb-[30px]'} animate-pulse`}
                  >
                    <div className="h-[268px] rounded-[20px] bg-neutral-100 lg:h-[284px]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : displayedProducts.length === 0 && products.length === 0 ? (
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
                {displayedProducts.map((product) => (
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

            {displayedProducts.length > visibleCards && (
              <CarouselNavigation
                language={language}
                onPrevious={goToPrevious}
                onNext={goToNext}
              />
            )}

            {displayedProducts.length > visibleCards && (
              <div className={PDP_RELATED_CAROUSEL_DOTS_CLASS}>
                <CarouselDots
                  totalItems={displayedProducts.length}
                  visibleItems={visibleCards}
                  currentIndex={currentIndex}
                  onDotClick={goToIndex}
                  scrollStep={scrollStep}
                  activeDotClassName={PDP_RELATED_CAROUSEL_DOT_ACTIVE_CLASS}
                  inactiveDotClassName={PDP_RELATED_CAROUSEL_DOT_INACTIVE_CLASS}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
