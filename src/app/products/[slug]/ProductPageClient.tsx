'use client';

import Link from 'next/link';
import {
  useLayoutEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
  useEffect,
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
import { publishCartUpdated } from '@/lib/cart/cart-events';
import { computeGuestCartSummary } from '@/lib/cart/guest-cart-summary';
import { rememberCartLineId } from '@/lib/cart/cart-line-id-cache';
import { readCartSummaryCache } from '@/lib/cartSummaryCache';
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
import { usePdpChrome } from './pdp-chrome-context';
import {
  PDP_HERO_FRAME_CLASS,
  PDP_HERO_GRID_CLASS,
  PDP_HERO_IMAGE_OFFSET_CLASS,
  PDP_HERO_INFO_OFFSET_CLASS,
  STOREFRONT_DESKTOP_CONTENT_CLASS,
} from '@/constants/pdp-figma-tokens';

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

/** Same horizontal box as UniversalHeader; no extra lg padding so image starts at header left edge. */
const PDP_CONTENT_SHELL_CLASS = `${STOREFRONT_DESKTOP_CONTENT_CLASS} relative z-10 max-lg:px-4 max-lg:py-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-0 lg:py-10`;

export interface ProductPageClientProps {
  slug: string;
  variantIdFromUrl: string | null;
  initialVisual: ProductVisualSnapshot | null;
  initialProduct: Product | null;
  initialReviewSummary: ProductReviewSummary;
  initialNotFound: boolean;
  serverLocale: StorefrontLocale;
}

export function ProductPageClient({
  slug,
  variantIdFromUrl,
  initialVisual,
  initialProduct,
  initialReviewSummary,
  initialNotFound,
  serverLocale,
}: ProductPageClientProps) {
  const { ref: reviewsSectionRef, inView: reviewsInView } = useLazyInView('320px');
  const { isLoggedIn } = useAuth();

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
  const awaitingDetails = !product && !notFound && !initialNotFound;
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
    skipMountFetch: Boolean(initialProduct),
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
    setQuantity,
    handleColorSelect,
    handleSizeSelect,
    handleAttributeValueSelect,
  } = page;

  useLayoutEffect(() => {
    if (!product) return;
    window.scrollTo(0, 0);
  }, [product?.id]);

  const handleResetProductOptions = useCallback(() => {
    setAdditions('');
    setExclusions('');
    if (!isOutOfStock) {
      setQuantity(1);
    }
  }, [isOutOfStock, setAdditions, setExclusions, setQuantity]);

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
        const { itemsCount, total } = computeGuestCartSummary();
        publishCartUpdated(itemsCount, total);
      } else {
        const response = await apiClient.post<{
          item: { id: string; quantity: number; price: number };
          cartSummary?: { itemsCount: number; total: number };
        }>('/api/v1/cart/items', {
          productId: product.id,
          variantId: currentVariant.id,
          quantity,
          customizations,
        });
        rememberCartLineId(product.id, currentVariant.id, response.item.id, response.item.quantity);
        if (response.cartSummary) {
          publishCartUpdated(response.cartSummary.itemsCount, response.cartSummary.total);
        } else {
          const cache = readCartSummaryCache();
          publishCartUpdated(
            (cache?.itemsCount ?? 0) + quantity,
            (cache?.total ?? 0) + currentVariant.price * quantity
          );
        }
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
      </ProductPageHydrationProvider>
    );
  }

  if (notFound && !product) {
    return (
      <ProductPageHydrationProvider hydrateDetails={hydrateDetails} markNotFound={markNotFound}>
        <BodyBackground color={PDP_BODY_BACKGROUND} />
        <div className={PDP_HEADER_DESKTOP_UNDERLAP_CLASS}>
          <div className={`${PDP_HEADER_DESKTOP_UNDERLAP_CLASS} mx-auto max-w-7xl max-lg:px-0 px-4 py-16 text-center space-y-4 lg:max-w-[1450px] lg:px-0`}>
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
      </ProductPageHydrationProvider>
    );
  }

  if (!product) {
    return (
      <ProductPageHydrationProvider hydrateDetails={hydrateDetails} markNotFound={markNotFound}>
        {null}
      </ProductPageHydrationProvider>
    );
  }

  return (
    <ProductPageHydrationProvider hydrateDetails={hydrateDetails} markNotFound={markNotFound}>
      <BodyBackground color={PDP_BODY_BACKGROUND} />
      <div
        className={`${PDP_HEADER_DESKTOP_UNDERLAP_CLASS} min-h-dvh overflow-x-hidden bg-white max-lg:min-h-0 lg:min-h-dvh`}
      >
        <div className={PDP_CONTENT_SHELL_CLASS}>
          <section className={`${PDP_HERO_FRAME_CLASS} max-lg:p-4 sm:max-lg:p-6 lg:p-0`}>
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
                  additions={additions}
                  exclusions={exclusions}
                  onAdditionsChange={setAdditions}
                  onExclusionsChange={setExclusions}
                  onResetOptions={handleResetProductOptions}
                />
              )}
              </div>
            </div>
          </section>

          {!detailsPending && (
            <>
              <div className="mt-8 max-lg:mt-8 lg:mt-10">
                <RelatedProducts
                  productSlug={slug}
                  categorySlug={product.categories?.[0]?.slug}
                  currentProductId={product.id}
                />
              </div>

              <div
                ref={reviewsSectionRef}
                id="product-reviews"
                className="mt-8 scroll-mt-24 max-lg:mt-8 lg:mt-10"
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
    </ProductPageHydrationProvider>
  );
}
