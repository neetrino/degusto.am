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
import { ProductImageGallery } from './ProductImageGallery';
import { ProductInfoAndActions } from './ProductInfoAndActions';
import { ProductInfoColumnSkeleton } from './ProductInfoColumnSkeleton';
import { ProductPageBelowFold } from './ProductPageBelowFold';
import { ProductPageShell } from './ProductPageShell';
import { useProductPage } from './useProductPage';
import { playCartFlyAnimation } from '../../../lib/cart-fly-animation';
import { BodyBackground } from '../../../components/BodyBackground';
import { publishCartUpdated, publishOptimisticCartAdd } from '@/lib/cart/cart-events';
import { rememberCartLineId } from '@/lib/cart/cart-line-id-cache';
import { clearCartLineRemoved } from '@/lib/cart/pending-cart-removals';
import { readCartSummaryCache } from '@/lib/cartSummaryCache';
import { logger } from '@/lib/utils/logger';
import {
  normalizeProductCustomizations,
} from '../../../lib/cart/customizations';
import type { LanguageCode } from '../../../lib/language';
import type { Product, ProductVariant } from './types';
import { resolveCustomizationAdditionValueIds } from './utils/resolve-pdp-customization-ingredients';
import type { StorefrontLocale } from '@/lib/i18n/locale';
import type { ProductReviewSummary } from '@/lib/services/reviews/product-review-summary';
import {
  mergeVisualIntoProduct,
  type ProductVisualSnapshot,
} from './utils/merge-visual-into-product';
import { ProductPageHydrationProvider } from './ProductPageHydrationContext';
import { useProductClientRefetch } from './hooks/useProductClientRefetch';
import { useProductReviewSummary } from './hooks/useProductReviewSummary';
import { usePdpChrome } from './pdp-chrome-context';
import {
  PDP_CONTENT_SHELL_CLASS,
  PDP_HERO_FRAME_CLASS,
  PDP_HERO_GRID_CLASS,
  PDP_HERO_IMAGE_OFFSET_CLASS,
  PDP_HERO_INFO_OFFSET_CLASS,
  PDP_MOBILE_HERO_INSET_CLASS,
} from '@/constants/pdp-figma-tokens';
import { STOREFRONT_DESKTOP_SECTION_CLASS } from '@/constants/storefront-desktop-layout';

function collectSelectedAttributeValueIdsForCart(
  product: Product,
  selected: Map<string, string>,
  additions: string,
  language: LanguageCode,
  currentVariant: ProductVariant | null
): string[] {
  const ids: string[] = [];
  const attrs = product.productAttributes;
  if (attrs) {
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
  }

  for (const id of resolveCustomizationAdditionValueIds(
    product,
    additions,
    language,
    currentVariant
  )) {
    if (!ids.includes(id)) {
      ids.push(id);
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
  initialProduct: Product | null;
  initialReviewSummary: ProductReviewSummary;
  initialNotFound: boolean;
  serverLocale: StorefrontLocale;
  /** Full product streams via `children` (ProductDetailsServer). */
  streamDetails?: boolean;
  children?: ReactNode;
}

export function ProductPageClient({
  slug,
  variantIdFromUrl,
  initialVisual,
  initialProduct,
  initialReviewSummary,
  initialNotFound,
  serverLocale,
  streamDetails = false,
  children,
}: ProductPageClientProps) {
  const { ref: reviewsSectionRef, inView: reviewsInView } = useLazyInView('320px');

  const [fullProduct, setFullProduct] = useState<Product | null>(initialProduct);
  const [reviewSummary, setReviewSummary] =
    useState<ProductReviewSummary>(initialReviewSummary);
  const [notFound, setNotFound] = useState(initialNotFound);

  const partialProduct = useMemo(
    () => (initialVisual ? mergeVisualIntoProduct(null, initialVisual) : null),
    [initialVisual]
  );

  const product = fullProduct ?? partialProduct;
  const detailsPending = Boolean(partialProduct && !fullProduct && !notFound);
  const awaitingDetails =
    !product && !notFound && !initialNotFound && !streamDetails;
  const productRef = useRef<Product | null>(product);
  const { setDesktopChromeReady } = usePdpChrome();

  const isDesktopChromeReady =
    Boolean(product) && !awaitingDetails && !detailsPending && !notFound;

  useEffect(() => {
    setDesktopChromeReady(isDesktopChromeReady);
    return () => setDesktopChromeReady(false);
  }, [isDesktopChromeReady, setDesktopChromeReady]);

  useEffect(() => {
    productRef.current = product;
  }, [product]);

  const hydrateDetails = useCallback((
    next: Product,
    summary: ProductReviewSummary
  ) => {
    setFullProduct(next);
    setReviewSummary(summary);
    setNotFound(false);
    productRef.current = next;
  }, []);

  const markNotFound = useCallback(() => {
    setFullProduct(null);
    setNotFound(true);
  }, []);

  const applyReviewSummary = useCallback((summary: ProductReviewSummary) => {
    setReviewSummary(summary);
  }, []);

  useProductReviewSummary(
    slug,
    !notFound && !initialNotFound && initialReviewSummary.count === 0,
    applyReviewSummary
  );

  useProductClientRefetch({
    slug,
    serverLocale,
    productRef,
    skipMountFetch: Boolean(initialProduct) || streamDetails,
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
    setAdditions,
    setExclusions,
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
    unitPriceUsd,
    price,
    originalPrice,
    compareAtPrice,
    discountPercent,
    maxQuantity,
    isOutOfStock,
    unavailableAttributes,
    canAddToCart,
    getOptionValue,
    adjustQuantity,
    setQuantity,
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
      selectedAttributeValues,
      additions,
      language,
      currentVariant
    );
    const customizations = normalizeProductCustomizations({
      additions,
      exclusions,
      ...(selectedIds.length > 0 ? { selectedAttributeValueIds: selectedIds } : {}),
    });
    const flyOrigin = document.querySelector('[data-product-fly-origin]');
    const imageUrl = images[currentImageIndex] ?? images[0] ?? null;

    publishOptimisticCartAdd({
      productId: product.id,
      productSlug: product.slug,
      variantId: currentVariant.id,
      title: product.title,
      image: imageUrl,
      price: unitPriceUsd,
      quantity,
      customizations,
    });

    playCartFlyAnimation({
      fromElement: flyOrigin,
    });
    setIsAddingToCart(true);
    try {
      const response = await apiClient.post<{
        item: { id: string; quantity: number; price: number };
        cartSummary?: { itemsCount: number; total: number };
      }>('/api/v1/cart/items', {
        productId: product.id,
        variantId: currentVariant.id,
        quantity,
        customizations,
      });

      rememberCartLineId(
        product.id,
        currentVariant.id,
        response.item.id,
        response.item.quantity,
        customizations
      );
      clearCartLineRemoved({
        variant: { id: currentVariant.id },
        customizations,
      });
      if (response.cartSummary) {
        publishCartUpdated(response.cartSummary.itemsCount, response.cartSummary.total);
      } else {
        const cache = readCartSummaryCache();
        publishCartUpdated(
          (cache?.itemsCount ?? 0) + quantity,
          (cache?.total ?? 0) + unitPriceUsd * quantity
        );
      }
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
          <div className={`${PDP_HEADER_DESKTOP_UNDERLAP_CLASS} ${STOREFRONT_DESKTOP_SECTION_CLASS} py-16 text-center space-y-4 max-lg:px-4`}>
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
        {streamDetails ? shell : null}
        {children}
      </ProductPageHydrationProvider>
    );
  }

  return (
    <ProductPageHydrationProvider hydrateDetails={hydrateDetails} markNotFound={markNotFound}>
      <BodyBackground color={PDP_BODY_BACKGROUND} />
      <div
        className={`${PDP_HEADER_DESKTOP_UNDERLAP_CLASS} min-h-dvh max-lg:overflow-x-visible overflow-x-hidden bg-white max-lg:min-h-0 lg:min-h-dvh`}
      >
        <div className={PDP_CONTENT_SHELL_CLASS}>
          <section className={`${PDP_HERO_FRAME_CLASS} ${PDP_MOBILE_HERO_INSET_CLASS} lg:p-0`}>
            <div className={PDP_HERO_GRID_CLASS}>
              <div className={PDP_HERO_IMAGE_OFFSET_CLASS}>
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
              </div>

              <div className={PDP_HERO_INFO_OFFSET_CLASS}>
              {detailsPending ? (
                <ProductInfoColumnSkeleton />
              ) : (
                <ProductInfoAndActions
                  product={product}
                  price={price}
                  originalPrice={originalPrice}
                  compareAtPrice={compareAtPrice}
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
                  onColorSelect={handleColorSelect}
                  onSizeSelect={handleSizeSelect}
                  onAttributeValueSelect={handleAttributeValueSelect}
                  getOptionValue={getOptionValue}
                  additions={additions}
                  exclusions={exclusions}
                  onAdditionsChange={setAdditions}
                  onExclusionsChange={setExclusions}
                />
              )}
              </div>
            </div>
          </section>
        </div>

          {!detailsPending && (
            <ProductPageBelowFold
              slug={slug}
              product={product}
              reviewsSectionRef={reviewsSectionRef}
              reviews={reviews}
              reviewsLoading={reviewsLoading}
              setReviews={setReviews}
            />
          )}
      </div>
      {children}
    </ProductPageHydrationProvider>
  );
}
