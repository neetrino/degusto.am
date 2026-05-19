'use client';

import Link from 'next/link';
import {
  useLayoutEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from 'react';
import { useLazyInView } from '../../../components/hooks/useLazyInView';
import { apiClient } from '../../../lib/api-client';
import { t } from '../../../lib/i18n';
import { useAuth } from '../../../lib/auth/AuthContext';
import { RelatedProducts } from '../../../components/RelatedProducts';
import { ProductReviews } from '../../../components/ProductReviews';
import { ProductImageGallery } from './ProductImageGallery';
import { ProductInfoAndActions } from './ProductInfoAndActions';
import { ProductInfoColumnSkeleton } from './ProductInfoColumnSkeleton';
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
import type { Product } from './types';
import type { StorefrontLocale } from '@/lib/i18n/locale';
import type { ProductReviewSummary } from '@/lib/services/reviews/product-review-summary';
import {
  mergeVisualIntoProduct,
  type ProductVisualSnapshot,
} from './utils/merge-visual-into-product';
import { ProductPageHydrationProvider } from './ProductPageHydrationContext';
import { useProductClientRefetch } from './hooks/useProductClientRefetch';

function collectSelectedAttributeValueIdsForCart(
  product: Product,
  selected: Map<string, string>
): string[] {
  const ids: string[] = [];
  const attrs = product.productAttributes;
  if (!attrs) {
    return ids;
  }
  for (const [key, raw] of selected.entries()) {
    if (key === 'color' || key === 'size') {
      continue;
    }
    const pa = attrs.find((p) => p.attribute.key === key);
    if (!pa) {
      continue;
    }
    const match = pa.attribute.values.find(
      (v) => v.id === raw || v.value === raw || v.label === raw
    );
    if (match?.id) {
      ids.push(match.id);
    }
  }
  return ids;
}

const PDP_BODY_BACKGROUND = '#ffffff';
const PDP_HEADER_DESKTOP_UNDERLAP_CLASS =
  'lg:relative lg:z-10 lg:-mt-[104px] lg:pt-[104px]';

export interface ProductPageClientProps {
  slug: string;
  variantIdFromUrl: string | null;
  initialVisual: ProductVisualSnapshot | null;
  serverLocale: StorefrontLocale;
  children: ReactNode;
}

export function ProductPageClient({
  slug,
  variantIdFromUrl,
  initialVisual,
  serverLocale,
  children,
}: ProductPageClientProps) {
  const { ref: reviewsSectionRef, inView: reviewsInView } = useLazyInView('320px');
  const { isLoggedIn } = useAuth();

  const [fullProduct, setFullProduct] = useState<Product | null>(null);
  const [reviewSummary, setReviewSummary] = useState<ProductReviewSummary>({
    count: 0,
    averageRating: 0,
  });
  const [notFound, setNotFound] = useState(false);

  const partialProduct = useMemo(
    () => (initialVisual ? mergeVisualIntoProduct(null, initialVisual) : null),
    [initialVisual]
  );

  const product = fullProduct ?? partialProduct;
  const detailsPending = Boolean(partialProduct && !fullProduct && !notFound);
  const awaitingDetails = !product && !notFound;
  const productRef = useRef<Product | null>(product);

  useEffect(() => {
    productRef.current = product;
  }, [product]);

  const hydrateDetails = useCallback((next: Product, summary: ProductReviewSummary) => {
    setFullProduct(next);
    setReviewSummary(summary);
    setNotFound(false);
    productRef.current = next;
  }, []);

  const markNotFound = useCallback(() => {
    setFullProduct(null);
    setNotFound(true);
  }, []);

  useProductClientRefetch({
    slug,
    serverLocale,
    productRef,
    skipMountFetch: Boolean(initialVisual),
    onLoaded: (next) => {
      setFullProduct(next);
      productRef.current = next;
    },
    onNotFound: markNotFound,
  });

  const page = useProductPage({
    slug,
    variantIdFromUrl,
    product,
    notFound,
    detailsPending,
    reviewSummary,
    fetchReviews: reviewsInView,
  });

  const {
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
    quantity,
    reviews,
    reviewsLoading,
    setReviews,
    averageRating,
    reviewsCount,
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
    unavailableAttributes,
    canAddToCart,
    scrollToReviews,
    getOptionValue,
    adjustQuantity,
    handleColorSelect,
    handleSizeSelect,
    handleAttributeValueSelect,
  } = page;

  useLayoutEffect(() => {
    if (!product) return;
    window.scrollTo(0, 0);
  }, [product?.id]);

  const handleAddToCart = async () => {
    if (!canAddToCart || !product || !currentVariant) return;
    const selectedIds = collectSelectedAttributeValueIdsForCart(
      product,
      selectedAttributeValues
    );
    const customizations = normalizeProductCustomizations({
      additions,
      exclusions,
      ...(selectedIds.length > 0 ? { selectedAttributeValueIds: selectedIds } : {}),
    });
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

  const shell = (
    <>
      <BodyBackground color={PDP_BODY_BACKGROUND} />
      <div className={PDP_HEADER_DESKTOP_UNDERLAP_CLASS}>
        <ProductPageShell />
      </div>
    </>
  );

  if (awaitingDetails) {
    return (
      <ProductPageHydrationProvider hydrateDetails={hydrateDetails} markNotFound={markNotFound}>
        {shell}
        {children}
      </ProductPageHydrationProvider>
    );
  }

  if (notFound && !product) {
    return (
      <ProductPageHydrationProvider hydrateDetails={hydrateDetails} markNotFound={markNotFound}>
        <BodyBackground color={PDP_BODY_BACKGROUND} />
        <div className={PDP_HEADER_DESKTOP_UNDERLAP_CLASS}>
          <div className="mx-auto max-w-7xl max-lg:px-0 px-4 py-16 text-center space-y-4">
            <p className="text-lg text-neutral-600">
              {t(language, 'common.messages.noProductsFound')}
            </p>
            <Link
              href="/shop"
              className="inline-flex h-10 items-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-50"
            >
              {t(language, 'common.navigation.products')}
            </Link>
          </div>
        </div>
        {children}
      </ProductPageHydrationProvider>
    );
  }

  if (!product) {
    return (
      <ProductPageHydrationProvider hydrateDetails={hydrateDetails} markNotFound={markNotFound}>
        {children}
      </ProductPageHydrationProvider>
    );
  }

  return (
    <ProductPageHydrationProvider hydrateDetails={hydrateDetails} markNotFound={markNotFound}>
      <BodyBackground color={PDP_BODY_BACKGROUND} />
      <div
        className={`${PDP_HEADER_DESKTOP_UNDERLAP_CLASS} min-h-dvh overflow-x-hidden max-lg:min-h-0 lg:min-h-dvh lg:bg-[var(--project-color)]`}
      >
        <div className="hidden lg:block">
          <ProjectGreenStripes extendFirstStrokeUp />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl max-lg:px-0 max-lg:py-0 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          <section className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-[0_8px_28px_rgba(0,0,0,0.06)] max-lg:rounded-none max-lg:border-0 max-lg:bg-transparent max-lg:p-0 max-lg:shadow-none sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 items-start gap-6 max-lg:gap-5 lg:grid-cols-[55%_45%] lg:gap-12">
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

              {detailsPending ? (
                <ProductInfoColumnSkeleton />
              ) : (
                <ProductInfoAndActions
                  product={product}
                  price={price}
                  originalPrice={originalPrice}
                  compareAtPrice={compareAtPrice}
                  discountPercent={discountPercent}
                  currency={currency}
                  language={language}
                  averageRating={averageRating}
                  reviewsCount={reviewsCount}
                  quantity={quantity}
                  maxQuantity={maxQuantity}
                  isOutOfStock={isOutOfStock}
                  unavailableAttributes={unavailableAttributes}
                  canAddToCart={canAddToCart}
                  isAddingToCart={isAddingToCart}
                  currentVariant={currentVariant}
                  attributeGroups={attributeGroups}
                  selectedColor={selectedColor}
                  selectedSize={selectedSize}
                  selectedAttributeValues={selectedAttributeValues}
                  colorGroups={colorGroups}
                  sizeGroups={sizeGroups}
                  onQuantityAdjust={adjustQuantity}
                  onAddToCart={handleAddToCart}
                  onScrollToReviews={scrollToReviews}
                  onColorSelect={handleColorSelect}
                  onSizeSelect={handleSizeSelect}
                  onAttributeValueSelect={handleAttributeValueSelect}
                  getOptionValue={getOptionValue}
                />
              )}
            </div>
          </section>

          {!detailsPending && (
            <>
              <div className="mt-8 rounded-3xl border border-neutral-200 bg-white p-3 shadow-[0_6px_22px_rgba(0,0,0,0.04)] max-lg:mt-8 max-lg:rounded-none max-lg:border-x-0 max-lg:border-b-0 max-lg:border-t max-lg:border-neutral-200 max-lg:bg-transparent max-lg:p-0 max-lg:pt-8 max-lg:shadow-none sm:mt-12 sm:p-4 lg:mt-10 lg:p-5">
                <RelatedProducts
                  productSlug={slug}
                  categorySlug={product.categories?.[0]?.slug}
                  currentProductId={product.id}
                />
              </div>

              <div
                ref={reviewsSectionRef}
                id="product-reviews"
                className="mt-8 scroll-mt-24 rounded-3xl border border-neutral-200 bg-white p-4 shadow-[0_6px_22px_rgba(0,0,0,0.04)] max-lg:mt-8 max-lg:rounded-none max-lg:border-x-0 max-lg:border-b-0 max-lg:border-t max-lg:border-neutral-200 max-lg:bg-transparent max-lg:pt-8 max-lg:shadow-none sm:mt-10 sm:p-6 lg:mt-10 lg:p-8"
              >
                <ProductReviews
                  productSlug={slug}
                  productId={product.id}
                  reviews={reviews}
                  reviewsLoading={reviewsLoading}
                  setReviews={setReviews}
                />
              </div>
            </>
          )}
        </div>
      </div>
      {children}
    </ProductPageHydrationProvider>
  );
}
