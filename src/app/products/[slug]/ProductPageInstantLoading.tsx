'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { ProductPageShell } from './ProductPageShell';
import { getProductSummarySnapshot } from '@/lib/products/product-summary-cache';
import { formatPrice, type CurrencyCode } from '@/lib/currency';
import { useTranslation } from '@/lib/i18n-client';
import { ChevronDown, Maximize2, Minus, Plus } from 'lucide-react';
import {
  PDP_FIGMA_ORANGE,
  PDP_HERO_FRAME_CLASS,
  PDP_HERO_GRID_CLASS,
  PDP_HERO_IMAGE_OFFSET_CLASS,
  PDP_HERO_INFO_OFFSET_CLASS,
  PDP_IMAGE_RADIUS_CLASS,
  PDP_MAIN_IMAGE_ASPECT_CLASS,
  PDP_MAIN_IMAGE_MAX_WIDTH_CLASS,
  PDP_MOBILE_HERO_INSET_CLASS,
  PDP_MOBILE_MAIN_IMAGE_BLEED_CLASS,
  PDP_MOBILE_SHELL_BLEED_CLASS,
  PDP_ACTIONS_MOBILE_TOP_ROW_CLASS,
  PDP_ACTIONS_ROW_CLASS,
  PDP_ADD_TO_CART_BUTTON_CLASS,
  PDP_CONTENT_SHELL_CLASS,
  PDP_COMPARE_PRICE_CLASS,
  PDP_DESCRIPTION_CLASS,
  PDP_IMAGE_DISCOUNT_BADGE_CLASS,
  PDP_PRICE_CLASS,
  PDP_PRICE_ROW_CLASS,
  PDP_PILL_RADIUS_CLASS,
  PDP_QUANTITY_SELECTOR_CLASS,
  PDP_RATING_STAR_GAP_CLASS,
  PDP_RATING_STAR_SIZE_CLASS,
  PDP_SECONDARY_ICON_BUTTON_CLASS,
} from '@/constants/pdp-figma-tokens';
import { resolveStorefrontProductImage } from '@/constants/storefront-product-image';
import { HomeOptimizedImage } from '@/components/home/HomeOptimizedImage';
import { PdpActionHeartIcon } from './PdpActionHeartIcon';
import { montserratArmFont } from '@/fonts/montserrat-arm-font';
import { r2Asset } from '@/lib/r2-public-url';
import { RelatedProductsSectionSkeleton } from '@/components/RelatedProducts/RelatedProductsSectionSkeleton';
import { ProductReviewsLoading } from '@/components/ProductReviews/ProductReviewsLoading';
import { PDP_RELATED_SECTION_GAP_CLASS } from '@/constants/pdp-figma-tokens';
import { getRelatedProductsSnapshot } from '@/lib/products/related-products-cache';
import { RatingStars } from '@/components/RatingStars';

const PDP_RATING_STAR_SRC = r2Asset('product/20260512-7jf6Wihrew.svg');

function parseSlugFromPathname(pathname: string | null): string | null {
  if (!pathname) {
    return null;
  }
  const segments = pathname.split('/').filter(Boolean);
  const productsIndex = segments.findIndex((segment) => segment === 'products');
  if (productsIndex < 0) {
    return null;
  }
  const rawSlug = segments[productsIndex + 1];
  if (!rawSlug) {
    return null;
  }
  const [slug] = rawSlug.split(':');
  return slug?.trim() || null;
}

export function ProductPageInstantLoading() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const summary = useMemo(() => {
    const slug = parseSlugFromPathname(pathname);
    if (!slug) {
      return null;
    }
    return getProductSummarySnapshot(slug);
  }, [pathname]);

  if (!summary) {
    return <ProductPageShell />;
  }

  const mainImage = resolveStorefrontProductImage(summary.image);
  const title = summary.title;
  const currency = summary.currency as CurrencyCode;
  const price = formatPrice(summary.price, currency);
  const oldPrice =
    summary.oldPrice != null && summary.oldPrice > summary.price
      ? formatPrice(summary.oldPrice, currency)
      : null;
  const description = summary.category?.title
    ? `${summary.category.title} — ${title}`
    : title;
  const discountText =
    summary.discount != null && summary.discount > 0
      ? `-${Math.round(summary.discount)}%`
      : null;
  const productSlug = parseSlugFromPathname(pathname);
  const relatedSnapshot =
    productSlug != null ? getRelatedProductsSnapshot(productSlug) : null;
  return (
    <div>
      <div className={PDP_CONTENT_SHELL_CLASS} aria-busy="true">
        <section className={`${PDP_HERO_FRAME_CLASS} ${PDP_MOBILE_HERO_INSET_CLASS} lg:p-0`}>
          <div className={PDP_HERO_GRID_CLASS}>
          <div
            className={`${PDP_HERO_IMAGE_OFFSET_CLASS} ${PDP_MOBILE_MAIN_IMAGE_BLEED_CLASS} flex w-full flex-col gap-4`}
          >
            <div
              className={`relative w-full overflow-hidden bg-neutral-100 ${PDP_MAIN_IMAGE_MAX_WIDTH_CLASS} ${PDP_MAIN_IMAGE_ASPECT_CLASS} ${PDP_IMAGE_RADIUS_CLASS}`}
            >
              <HomeOptimizedImage
                src={mainImage}
                alt={title}
                fill
                className="object-cover"
                loading="eager"
                sizes="(min-width: 1024px) 46vw, 100vw"
              />
              {discountText ? (
                <div className={PDP_IMAGE_DISCOUNT_BADGE_CLASS}>{discountText}</div>
              ) : null}
              <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-3">
                <button
                  type="button"
                  className={`flex h-12 w-12 items-center justify-center bg-white ${PDP_PILL_RADIUS_CLASS}`}
                  aria-label={t('common.ariaLabels.fullscreenImage')}
                >
                  <Maximize2 className="h-5 w-5 text-gray-800" />
                </button>
              </div>
            </div>
          </div>

          <div className={PDP_HERO_INFO_OFFSET_CLASS}>
            <div className="flex w-full max-w-full flex-col self-start max-lg:px-0 max-lg:py-0 lg:h-full lg:min-h-0 lg:justify-between lg:self-stretch lg:px-0 lg:py-0">
              <div>
              <h1
                className={`mb-2 break-words text-[2.25rem] font-[700] not-italic leading-normal text-[#3C2F2F] ${montserratArmFont.className}`}
              >
                {title}
              </h1>
              <RatingStars
                rating={summary.rating ?? 5}
                starSrc={PDP_RATING_STAR_SRC}
                className={`mb-5 flex items-center ${PDP_RATING_STAR_GAP_CLASS}`}
                starClassName={PDP_RATING_STAR_SIZE_CLASS}
              />
              <div className={PDP_PRICE_ROW_CLASS}>
                <p
                  className={`${PDP_PRICE_CLASS} ${montserratArmFont.className}`}
                >
                  {price}
                </p>
                {oldPrice ? (
                  <span
                    className={`${PDP_COMPARE_PRICE_CLASS} ${montserratArmFont.className}`}
                  >
                    {oldPrice}
                  </span>
                ) : null}
              </div>

              <p className={PDP_DESCRIPTION_CLASS}>
                {description}
              </p>

              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
                <div
                  className={`inline-flex h-12 w-[12.1875rem] items-center bg-[#e4e4e4] pl-2 pr-2 ${PDP_PILL_RADIUS_CLASS}`}
                >
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ff7f20] text-white">
                    <Plus className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1 truncate pl-2 text-left text-base font-medium text-black">
                    {t('product.customizationAddShort')}
                  </span>
                  <ChevronDown className="h-7 w-7 shrink-0 text-black" strokeWidth={1.75} />
                </div>
                <div
                  className={`inline-flex h-12 w-[10.9375rem] items-center bg-[#e4e4e4] pl-2 pr-2 ${PDP_PILL_RADIUS_CLASS}`}
                >
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ff7f20] text-white">
                    <Minus className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1 truncate pl-2 text-left text-base font-medium text-black">
                    {t('product.customizationExcludeShort')}
                  </span>
                  <ChevronDown className="h-7 w-7 shrink-0 text-black" strokeWidth={1.75} />
                </div>
              </div>
              </div>

              <div className="mt-6 pt-2 lg:mt-auto lg:pt-0">
                <div className={PDP_ACTIONS_ROW_CLASS}>
                  <div className={PDP_ACTIONS_MOBILE_TOP_ROW_CLASS}>
                    <div className={PDP_QUANTITY_SELECTOR_CLASS} role="group" aria-label={t('common.messages.quantity')}>
                      <button
                        type="button"
                        className="flex h-8 w-8 shrink-0 items-center justify-center"
                        style={{ color: PDP_FIGMA_ORANGE }}
                        aria-label={t('common.ariaLabels.decreaseQuantity')}
                      >
                        <Minus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
                      </button>
                      <span
                        className="min-w-[1.75rem] select-none text-center text-lg font-medium tabular-nums"
                        style={{ color: PDP_FIGMA_ORANGE }}
                      >
                        1
                      </span>
                      <button
                        type="button"
                        className="flex h-8 w-8 shrink-0 items-center justify-center"
                        style={{ color: PDP_FIGMA_ORANGE }}
                        aria-label={t('common.ariaLabels.increaseQuantity')}
                      >
                        <Plus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
                      </button>
                    </div>
                    <button type="button" className={`${PDP_ADD_TO_CART_BUTTON_CLASS} ${PDP_PILL_RADIUS_CLASS}`}>
                      {t('product.addToCart')}
                    </button>
                    <button type="button" className={PDP_SECONDARY_ICON_BUTTON_CLASS} aria-label={t('common.ariaLabels.addToWishlist')}>
                      <span className="text-[#494949]">
                        <PdpActionHeartIcon />
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </section>
      </div>
      <div className={PDP_RELATED_SECTION_GAP_CLASS}>
        <RelatedProductsSectionSkeleton
          language={relatedSnapshot?.language ?? 'hy'}
          skeletonCardWidth="50%"
          skeletonCount={2}
          compact
        />
      </div>
      <div className={PDP_CONTENT_SHELL_CLASS}>
        <div
          id="product-reviews"
          className="mt-8 scroll-mt-24 max-lg:mt-8 lg:mt-10"
          aria-busy="true"
        >
          <ProductReviewsLoading />
        </div>
      </div>
    </div>
  );
}
