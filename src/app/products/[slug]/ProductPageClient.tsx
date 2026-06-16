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
import { ProductReviewsLoading } from '@/components/ProductReviews/ProductReviewsLoading';
import { RelatedProducts } from '@/components/RelatedProducts';
import { ProductPageShell } from './ProductPageShell';
import { ProductPrimaryMeta } from './ProductPrimaryMeta';
import { useProductPage } from './useProductPage';
import { playCartFlyAnimation } from '../../../lib/cart-fly-animation';
import { BodyBackground } from '../../../components/BodyBackground';
import { publishOptimisticCartAdd, publishCartLineConfirmed, publishCartForceReload } from '@/lib/cart/cart-events';
import { rememberCartLineId } from '@/lib/cart/cart-line-id-cache';
import { clearCartLineRemoved } from '@/lib/cart/pending-cart-removals';
import { logger } from '@/lib/utils/logger';
import {
  normalizeProductCustomizations,
} from '../../../lib/cart/customizations';
import type { LanguageCode } from '../../../lib/language';
import type { Product, ProductVariant } from './types';
import { resolveCustomizationAdditionValueIds } from './utils/resolve-pdp-customization-ingredients';
import type { StorefrontLocale } from '@/lib/i18n/locale';
import type { ProductReviewSummary } from '@/lib/services/reviews/product-review-summary';
import type { RelatedCardPayload } from '@/lib/services/products-slug/product-related-transform';
import {
  mergeVisualIntoProduct,
  type ProductVisualSnapshot,
} from './utils/merge-visual-into-product';
import { ProductPageHydrationProvider } from './ProductPageHydrationContext';
import { useProductClientRefetch } from './hooks/useProductClientRefetch';
import { useProductReviewSummary } from './hooks/useProductReviewSummary';
import { usePdpChrome } from './pdp-chrome-context';
import {
  markPdpFullHydrationMetric,
  markPdpPrimaryPaintMetric,
} from '@/lib/products/pdp-progressive-metrics';
import {
  getProductSummarySnapshot,
  setProductSummarySnapshot,
} from '@/lib/products/product-summary-cache';
import { getProductDetailsSnapshot, setProductDetailsSnapshot } from '@/lib/products/product-details-cache';
import { useHasMounted } from '@/hooks/useHasMounted';
import {
  PDP_CONTENT_SHELL_CLASS,
  PDP_HERO_FRAME_CLASS,
  PDP_HERO_GRID_CLASS,
  PDP_HERO_IMAGE_OFFSET_CLASS,
  PDP_HERO_INFO_OFFSET_CLASS,
  PDP_MOBILE_HERO_INSET_CLASS,
  PDP_RELATED_SECTION_GAP_CLASS,
} from '@/constants/pdp-figma-tokens';
import { STOREFRONT_DESKTOP_SECTION_CLASS } from '@/constants/storefront-desktop-layout';
import { UNIVERSAL_HEADER_DESKTOP_UNDERLAP_CLASS } from '@/constants/universal-header-layout';

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
const PDP_ADD_TO_CART_BLOCK_WINDOW_MS = 700;

const PDP_HEADER_DESKTOP_UNDERLAP_CLASS =
  `lg:relative lg:z-10 ${UNIVERSAL_HEADER_DESKTOP_UNDERLAP_CLASS}`;

function ProductPageNotFoundContent({
  language,
  children,
}: {
  language: LanguageCode;
  children?: ReactNode;
}) {
  return (
    <>
      <BodyBackground color={PDP_BODY_BACKGROUND} />
      <div className={PDP_HEADER_DESKTOP_UNDERLAP_CLASS}>
        <div
          className={`${PDP_HEADER_DESKTOP_UNDERLAP_CLASS} ${STOREFRONT_DESKTOP_SECTION_CLASS} py-16 text-center space-y-4 max-lg:px-4`}
        >
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
    </>
  );
}

function ProductPagePendingScaffold({ relatedSection }: { relatedSection: ReactNode }) {
  return (
    <>
      {relatedSection}
      <div className={PDP_CONTENT_SHELL_CLASS}>
        <div
          id="product-reviews"
          className="mt-8 scroll-mt-24 max-lg:mt-8 lg:mt-10"
          aria-busy="true"
        >
          <ProductReviewsLoading />
        </div>
      </div>
    </>
  );
}

interface UseProductAddToCartHandlerParams {
  canAddToCart: boolean;
  isAddingToCart: boolean;
  product: Product | null;
  currentVariant: ProductVariant | null;
  setIsAddingToCart: (next: boolean) => void;
  addToCartBlockTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  selectedAttributeValues: Map<string, string>;
  additions: string;
  exclusions: string;
  language: LanguageCode;
  images: string[];
  currentImageIndex: number;
  unitPriceUsd: number;
  quantity: number;
}

function useProductAddToCartHandler({
  canAddToCart,
  isAddingToCart,
  product,
  currentVariant,
  setIsAddingToCart,
  addToCartBlockTimerRef,
  selectedAttributeValues,
  additions,
  exclusions,
  language,
  images,
  currentImageIndex,
  unitPriceUsd,
  quantity,
}: UseProductAddToCartHandlerParams) {
  return useCallback(async () => {
    if (!canAddToCart || isAddingToCart || !product || !currentVariant) return;

    setIsAddingToCart(true);
    if (addToCartBlockTimerRef.current) {
      clearTimeout(addToCartBlockTimerRef.current);
    }
    addToCartBlockTimerRef.current = setTimeout(() => {
      setIsAddingToCart(false);
      addToCartBlockTimerRef.current = null;
    }, PDP_ADD_TO_CART_BLOCK_WINDOW_MS);

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
    const optimisticVariantId = currentVariant.id;

    publishOptimisticCartAdd({
      productId: product.id,
      productSlug: product.slug,
      variantId: optimisticVariantId,
      title: product.title,
      image: imageUrl,
      price: unitPriceUsd,
      quantity,
      customizations,
    });

    playCartFlyAnimation({
      fromElement: flyOrigin,
    });

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
        productId: product.id,
        customizations,
      });

      const summary = response.cartSummary ?? {
        itemsCount: 0,
        total: 0,
      };

      publishCartLineConfirmed(
        {
          productId: product.id,
          previousVariantId: optimisticVariantId,
          variantId: currentVariant.id,
          customizations,
          serverItemId: response.item.id,
          quantity: response.item.quantity,
          price: response.item.price,
        },
        summary
      );
    } catch (error: unknown) {
      logger.warn('Add to cart failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      publishCartForceReload();
    }
  }, [
    canAddToCart,
    isAddingToCart,
    product,
    currentVariant,
    setIsAddingToCart,
    addToCartBlockTimerRef,
    selectedAttributeValues,
    additions,
    exclusions,
    language,
    images,
    currentImageIndex,
    unitPriceUsd,
    quantity,
  ]);
}

export interface ProductPageClientProps {
  slug: string;
  variantIdFromUrl: string | null;
  initialVisual: ProductVisualSnapshot | null;
  initialProduct: Product | null;
  initialReviewSummary: ProductReviewSummary;
  initialRelatedProducts: RelatedCardPayload[];
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
  initialRelatedProducts,
  initialNotFound,
  serverLocale,
  streamDetails = false,
  children,
}: ProductPageClientProps) {
  const hasMounted = useHasMounted();
  const initialCachedProduct =
    !initialProduct && !initialNotFound ? getProductDetailsSnapshot(slug) : null;
  const { ref: reviewsSectionRef, inView: reviewsInView } = useLazyInView('320px');

  const [fullProduct, setFullProduct] = useState<Product | null>(initialProduct ?? initialCachedProduct);
  const [reviewSummary, setReviewSummary] =
    useState<ProductReviewSummary>(initialReviewSummary);
  const [notFound, setNotFound] = useState(initialNotFound);

  const [cachedSummaryProduct, setCachedSummaryProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!hasMounted) {
      return;
    }
    if (initialProduct || initialNotFound) {
      setCachedSummaryProduct(null);
      return;
    }
    const summary = getProductSummarySnapshot(slug);
    if (!summary) {
      setCachedSummaryProduct(null);
      return;
    }
    setCachedSummaryProduct(
      mergeVisualIntoProduct(null, {
        id: summary.id,
        slug: summary.slug,
        title: summary.title,
        category: summary.category,
        brand: summary.brand,
        price: summary.price,
        oldPrice: summary.oldPrice,
        discountPercent: summary.discount,
        currency: summary.currency,
        inStock: summary.inStock,
        defaultVariantId: summary.defaultVariantId,
        labels: summary.labels,
        galleryImages: summary.image ? [summary.image] : [],
      })
    );
  }, [hasMounted, initialProduct, initialNotFound, slug]);

  const partialProduct = useMemo(() => {
    if (!initialVisual) {
      return null;
    }
    // Preserve clicked-card snapshot price/currency during loading if available.
    return mergeVisualIntoProduct(cachedSummaryProduct, initialVisual);
  }, [cachedSummaryProduct, initialVisual]);

  const product = fullProduct ?? partialProduct ?? cachedSummaryProduct;
  const detailsPending = Boolean((partialProduct || cachedSummaryProduct) && !fullProduct && !notFound);
  const awaitingDetails =
    !product && !notFound && !initialNotFound && !streamDetails;
  const productRef = useRef<Product | null>(product);
  const addToCartBlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { setDesktopChromeReady } = usePdpChrome();

  const isDesktopChromeReady =
    Boolean(product) && !awaitingDetails && !detailsPending && !notFound;

  useEffect(() => {
    if (!product || notFound) {
      return;
    }
    if (fullProduct) {
      markPdpPrimaryPaintMetric(slug, 'full');
      markPdpFullHydrationMetric(slug);
      return;
    }
    if (partialProduct) {
      markPdpPrimaryPaintMetric(slug, 'visual');
      return;
    }
    if (cachedSummaryProduct) {
      markPdpPrimaryPaintMetric(slug, 'summary');
      return;
    }
    markPdpPrimaryPaintMetric(slug, 'unknown');
  }, [slug, product, notFound, fullProduct, partialProduct, cachedSummaryProduct]);

  useEffect(() => {
    setDesktopChromeReady(isDesktopChromeReady);
    return () => setDesktopChromeReady(false);
  }, [isDesktopChromeReady, setDesktopChromeReady]);

  useEffect(() => {
    productRef.current = product;
  }, [product]);

  useEffect(
    () => () => {
      if (addToCartBlockTimerRef.current) {
        clearTimeout(addToCartBlockTimerRef.current);
        addToCartBlockTimerRef.current = null;
      }
    },
    []
  );

  useEffect(() => {
    if (!fullProduct) {
      return;
    }
    setProductDetailsSnapshot(fullProduct);
  }, [fullProduct]);

  useEffect(() => {
    if (!product) {
      return;
    }
    const category = product.categories?.[0]
      ? {
          slug: product.categories[0].slug,
          title: product.categories[0].title,
        }
      : null;
    const firstVariant = product.variants[0] ?? null;
    const mainImage =
      typeof product.media?.[0] === 'string'
        ? product.media[0]
        : product.media?.[0]?.url ?? firstVariant?.imageUrl ?? null;
    setProductSummarySnapshot({
      id: product.id,
      slug: product.slug,
      title: product.title,
      image: mainImage,
      price: firstVariant?.price ?? 0,
      oldPrice: firstVariant?.originalPrice ?? firstVariant?.compareAtPrice ?? null,
      discount:
        product.productDiscount ??
        firstVariant?.productDiscount ??
        product.globalDiscount ??
        firstVariant?.globalDiscount ??
        null,
      rating: averageRating > 0 ? averageRating : null,
      category,
      brand: null,
      currency: 'USD',
      labels: product.labels ?? [],
      inStock: (firstVariant?.stock ?? 0) > 0,
      defaultVariantId: firstVariant?.id ?? null,
    });
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
    !notFound && !initialNotFound && initialReviewSummary.count === 0 && !detailsPending,
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

  const handleAddToCart = useProductAddToCartHandler({
    canAddToCart,
    isAddingToCart,
    product,
    currentVariant,
    setIsAddingToCart,
    addToCartBlockTimerRef,
    selectedAttributeValues,
    additions,
    exclusions,
    language,
    images,
    currentImageIndex,
    unitPriceUsd,
    quantity,
  });

  const shell = (
    <>
      <BodyBackground color={PDP_BODY_BACKGROUND} />
      <div className={PDP_HEADER_DESKTOP_UNDERLAP_CLASS}>
        <ProductPageShell />
      </div>
    </>
  );

  const relatedSection = (
    <div className={PDP_RELATED_SECTION_GAP_CLASS}>
      <RelatedProducts
        productSlug={slug}
        categorySlug={product?.categories?.[0]?.slug}
        currentProductId={product?.id ?? '__loading__'}
        initialProducts={initialRelatedProducts}
        initialLanguage={serverLocale}
      />
    </div>
  );

  if (awaitingDetails) {
    return (
      <ProductPageHydrationProvider hydrateDetails={hydrateDetails} markNotFound={markNotFound}>
        {shell}
        <ProductPagePendingScaffold relatedSection={relatedSection} />
        {children}
      </ProductPageHydrationProvider>
    );
  }

  if (notFound && !product) {
    return (
      <ProductPageHydrationProvider hydrateDetails={hydrateDetails} markNotFound={markNotFound}>
        <ProductPageNotFoundContent language={language}>
          {children}
        </ProductPageNotFoundContent>
      </ProductPageHydrationProvider>
    );
  }

  if (!product) {
    return (
      <ProductPageHydrationProvider hydrateDetails={hydrateDetails} markNotFound={markNotFound}>
        {streamDetails ? (
          <>
            {shell}
            <ProductPagePendingScaffold relatedSection={relatedSection} />
          </>
        ) : null}
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
              {detailsPending && !product ? (
                <ProductInfoColumnSkeleton />
              ) : (
                <>
                  <ProductPrimaryMeta
                    categoryTitle={product.categories?.[0]?.title}
                    brand={null}
                    language={language}
                  />
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
                    hideSecondaryDetails={detailsPending}
                  />
                </>
              )}
              </div>
            </div>
          </section>
        </div>

          {detailsPending ? (
            <ProductPagePendingScaffold relatedSection={relatedSection} />
          ) : (
            <ProductPageBelowFold
              slug={slug}
              product={product}
              initialRelatedProducts={initialRelatedProducts}
              serverLocale={serverLocale}
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
