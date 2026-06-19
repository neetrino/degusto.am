'use client';

import { ViewMoreButton } from '../view-more/ViewMoreButton';
import { useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';
import { UniversalHeader } from '../UniversalHeader';
import { ProjectGreenStripes } from '../decor/ProjectGreenStripes';
import { Footer } from '../Footer';
import { useTranslation } from '../../lib/i18n-client';
import { useCurrency } from '../hooks/useCurrency';
import { formatPrice } from '../../lib/currency';
import { useAddToCart } from '../hooks/useAddToCart';
import { useWishlist } from '../hooks/useWishlist';
import { useAuth } from '../../lib/auth/AuthContext';
import { WishlistHeartIcon } from '../icons/WishlistHeartIcon';
import { getHomeCategoryHref } from './homeCategoryLinks';
import { HomeProductFoodAttributeBadges } from './HomeProductFoodAttributeBadges';
import { montserratArmFont } from '@/fonts/montserrat-arm-font';
import { FIGMA_PRODUCT_CARD_CREAM_HOVER_CLASS } from '@/constants/mobile-figma-storefront';
import {
  getProductCardWishlistHoverClasses,
  PRODUCT_CARD_CART_BTN_HOVER_CLASS,
  PRODUCT_CARD_ICON_BTN_INTERACTION_CLASS,
  PRODUCT_CARD_WISHLIST_ICON_HOVER_CLASS,
} from '@/constants/product-card-action-hover';
import { r2Asset } from '@/lib/r2-public-url';
import { resolveStorefrontProductImage } from '@/constants/storefront-product-image';
import { HomeOptimizedImage } from './HomeOptimizedImage';
import { StorefrontProductOverlayLink } from './StorefrontProductOverlayLink';
import { HomeDailyOfferHeroCard } from './HomeDailyOfferHeroCard';
import { StorefrontCategoryLink } from '../routing/StorefrontCategoryLink';
import { resolveHomeDailyOfferProduct } from './home-daily-offer';
import type { HomeCategoryItem, HomeFeaturedProduct } from './home-page-types';
import { STOREFRONT_DESKTOP_SECTION_CLASS } from '@/constants/storefront-desktop-layout';
import { createProductPreviewSummary } from '@/lib/products/product-preview';
import { RatingStars } from '@/components/RatingStars';
import { homeFeaturedProductToWishlistSnapshot } from '@/lib/wishlist/wishlist-product-snapshot-mappers';

export type { HomeCategoryItem, HomeFeaturedProduct } from './home-page-types';

const assets = {
  heroBg: r2Asset('hero/20260512-tOKhBzyB6u.png'),
  offerBadge: r2Asset('assets/20260512-3dEN1cAZhG.svg'),
  productCardAddToCart: r2Asset('product/20260512-g67zkm13ZH.svg'),
  productCardHot: r2Asset('product/20260512-dWv7-ZfxP1.svg'),
  productCardRibbon: r2Asset('product/20260512-lmzrYlGD39.svg'),
  productCardStar: r2Asset('product/20260512-7jf6Wihrew.svg'),
  categorySoup: r2Asset('category/20260512-27SeUi_ujs.png'),
  categorySalad: r2Asset('category/20260512-Np6RG2GuNi.png'),
  categoryShawarma: r2Asset('category/20260512-UOlekxqQyh.png'),
  categoryPizza: r2Asset('category/20260512-j5QKmShMEM.png'),
};

/** Desktop home categories block surface; footer outer wrapper uses the same for a continuous edge. */
const HOME_DESKTOP_CATEGORY_SURFACE_CLASS = 'bg-[#e6e6e8]';

const DESKTOP_HOME_SPECIAL_OFFERS_PRODUCT_COUNT = 5;

/** Overlaps hero (daily offer z-20) — title row stays on top at every viewport width. */
const HOME_DESKTOP_SPECIAL_OFFERS_SECTION_STACKING_CLASS = 'relative isolate z-30';
const HOME_DESKTOP_SPECIAL_OFFERS_HEADER_STACKING_CLASS = 'relative z-40';

/** Desktop hero background offset from section top (lower = image sits higher). */
const HOME_DESKTOP_HERO_BG_TOP_CLASS = 'top-[68px]';

/** Figma node 1:748 — home desktop category card border frame. */
const HOME_DESKTOP_CATEGORY_CARD_FILL_CLASS = 'bg-[#121212]';
const HOME_DESKTOP_CATEGORY_CARD_SIZE_CLASS = 'h-[22.6875rem] w-[19.0625rem]';

function NewsCard({ item }: { item: HomeFeaturedProduct }) {
  const { t } = useTranslation();
  const currency = useCurrency();
  const router = useRouter();
  const keepCurrencySymbolAttached = (value: string): string => value.replace(/\s+(\S+)$/u, '\u00A0$1');
  const hasDiscount = typeof item.discountPercent === 'number' && item.discountPercent > 0;
  const discountPercent = typeof item.discountPercent === 'number' ? Math.round(item.discountPercent) : null;
  const imageSrc = resolveStorefrontProductImage(item.image);
  const title = item.title;
  const subtitle = item.subtitle ?? '';
  const formattedPrice = keepCurrencySymbolAttached(formatPrice(item.price || 0, currency));
  const formattedOldPrice = item.oldPrice ? keepCurrencySymbolAttached(formatPrice(item.oldPrice, currency)) : null;
  const mainPriceClassName = formattedPrice.length > 12 ? 'text-[18px]' : 'text-[20px]';
  const displayRating = item.rating ?? 5;
  const productHref = `/products/${item.slug}`;
  const { isLoggedIn } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist(item.id);
  const { isAddingToCart, addToCart } = useAddToCart({
    productId: item.id,
    productSlug: item.slug,
    inStock: item.inStock ?? true,
    defaultVariantId: item.defaultVariantId ?? undefined,
    price: item.price ?? undefined,
  });
  const handleAddToCart = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const button = event.currentTarget as HTMLElement;
    const card = button.closest('[data-home-product-card]');
    const origin =
      (card?.querySelector('[data-product-fly-origin]') as HTMLElement | null) ?? button;
    void addToCart({ origin, imageUrl: resolveStorefrontProductImage(item.image) });
  };

  const handleWishlistToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent(productHref)}`);
      return;
    }
    void toggleWishlist(homeFeaturedProductToWishlistSnapshot(item));
  };
  const previewSummary = createProductPreviewSummary({
    id: item.id,
    slug: item.slug,
    title,
    image: imageSrc,
    price: item.price,
    oldPrice: item.oldPrice,
    discount: item.discountPercent,
    category: subtitle ? { slug: `preview-${item.id}`, title: subtitle } : null,
    rating: item.rating ?? 5,
    currency,
    inStock: item.inStock ?? true,
    defaultVariantId: item.defaultVariantId ?? null,
  });

  return (
    <article
      data-home-product-card
      className={`relative h-[284px] w-[236px] shrink-0 cursor-pointer rounded-[20px] border-[1.5px] border-[#dedede] bg-white transition-colors ${FIGMA_PRODUCT_CARD_CREAM_HOVER_CLASS} hover:shadow-md`}
    >
      <StorefrontProductOverlayLink slug={item.slug} label={title} preview={previewSummary} />
      <div data-product-fly-origin className="absolute left-1/2 top-1 h-[147px] w-[227px] -translate-x-1/2 overflow-hidden rounded-[18px]">
        <HomeOptimizedImage
          src={imageSrc}
          alt={title}
          width={227}
          height={147}
          className="h-full w-full object-cover"
          loading="lazy"
          sizes="236px"
        />
      </div>
      <HomeProductFoodAttributeBadges
        variant="desktop-card"
        supportsSpicy={item.supportsSpicy ?? false}
        supportsGreens={item.supportsGreens ?? false}
        hotIconSrc={assets.productCardHot}
        greensIconSrc={assets.productCardRibbon}
      />
      <button
        type="button"
        onClick={handleWishlistToggle}
        className={`absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border shadow-md sm:h-10 sm:w-10 ${PRODUCT_CARD_ICON_BTN_INTERACTION_CLASS} ${getProductCardWishlistHoverClasses(isInWishlist)} ${
          isInWishlist
            ? 'border-red-600 bg-red-600 text-white'
            : 'border-[#dedede]/90 bg-white/95 text-gray-700'
        }`}
        title={
          isInWishlist ? t('common.messages.removedFromWishlist') : t('common.messages.addedToWishlist')
        }
        aria-label={
          isInWishlist ? t('common.ariaLabels.removeFromWishlist') : t('common.ariaLabels.addToWishlist')
        }
      >
        <span className={PRODUCT_CARD_WISHLIST_ICON_HOVER_CLASS} aria-hidden>
          <WishlistHeartIcon filled={isInWishlist} size={18} />
        </span>
      </button>
      <div className="absolute left-[14px] top-[170px] flex items-center gap-[6px]">
        <RatingStars
          rating={displayRating / 5}
          starSrc={assets.productCardStar}
          className="flex items-center"
          starClassName="h-4 w-4"
          maxStars={1}
        />
        <p className="text-base font-medium leading-[1.35] text-[rgba(60,47,47,0.62)]">
          {displayRating.toFixed(1)}
        </p>
      </div>
      <div className="absolute left-[14px] top-[194px] w-[130px]">
        <h3 className="text-base font-bold leading-[1.05] text-[#3c2f2f]">
          <span className="block max-h-[34px] overflow-hidden break-words">{title}</span>
        </h3>
        <p className="mt-1 truncate text-base font-medium leading-[1.2] text-[#a1a1a1]">{subtitle}</p>
      </div>
      {hasDiscount ? (
        <span className="absolute right-px top-[170px] inline-flex h-[30px] items-center rounded-[60px] bg-[#ff7f20] px-[17px] text-sm font-bold leading-none text-black">
          -{discountPercent}%
        </span>
      ) : null}
      <div className="absolute right-[14px] top-[228px] flex max-w-[112px] flex-col items-end text-right">
        <p className={`w-full whitespace-nowrap font-black leading-none tabular-nums text-[#3c2f2f] ${mainPriceClassName}`}>
          {formattedPrice}
        </p>
        {formattedOldPrice ? (
          <p className="mt-2 w-full translate-x-[8px] whitespace-nowrap text-sm font-light leading-none tabular-nums text-[#3c2f2f] line-through">
            {formattedOldPrice}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isAddingToCart || (item.inStock === false)}
        className={`absolute -bottom-[25px] left-1/2 z-20 inline-flex h-[52px] w-[51px] -translate-x-1/2 items-center justify-center ${PRODUCT_CARD_CART_BTN_HOVER_CLASS}`}
      >
        <HomeOptimizedImage
          src={assets.productCardAddToCart}
          alt={t('common.buttons.addToCart')}
          width={51}
          height={52}
          className="h-[52px] w-[51px] object-contain"
          loading="lazy"
        />
      </button>
    </article>
  );
}

function CategoryCard({ item }: { item: HomeCategoryItem }) {
  return (
    <StorefrontCategoryLink
      href={getHomeCategoryHref(item)}
      className={`block overflow-hidden rounded-[22px] p-4 ${HOME_DESKTOP_CATEGORY_CARD_FILL_CLASS} ${HOME_DESKTOP_CATEGORY_CARD_SIZE_CLASS} transition-transform hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f66913]`}
      aria-label={item.title}
    >
      <h3 className="min-h-[56px] text-2xl font-black leading-tight text-white">{item.title}</h3>
      <p className="mb-2 mt-1 text-sm text-white/80">({item.count} ապրանք)</p>
      <HomeOptimizedImage
        src={item.image}
        alt={item.title}
        width={240}
        height={190}
        className="mx-auto h-auto w-full max-w-[240px] object-contain"
        loading="lazy"
        sizes="240px"
      />
    </StorefrontCategoryLink>
  );
}

export function FigmaHomePage({
  featuredProducts,
  categories,
  dailyOfferProduct,
}: {
  featuredProducts: HomeFeaturedProduct[];
  categories: HomeCategoryItem[];
  dailyOfferProduct?: HomeFeaturedProduct | null;
}) {
  const { t, lang } = useTranslation();
  const specialOfferProducts = featuredProducts.slice(0, DESKTOP_HOME_SPECIAL_OFFERS_PRODUCT_COUNT);
  const heroProduct = resolveHomeDailyOfferProduct(featuredProducts, dailyOfferProduct);
  const armenianHeadingClassName = lang === 'hy' ? montserratArmFont.className : '';

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-[var(--project-color)] lg:block">
      <section className="relative w-full overflow-x-clip bg-[var(--project-color)] pb-56 pt-8 lg:min-h-[680px] lg:overflow-y-visible lg:pb-0 lg:pt-8 xl:min-h-[780px] 2xl:min-h-[930px]">
        <div
          className={`pointer-events-none absolute inset-x-0 ${HOME_DESKTOP_HERO_BG_TOP_CLASS} z-0 h-[900px] w-full lg:h-full`}
        >
          <div className="relative h-full w-full">
            <HomeOptimizedImage
            src={assets.heroBg}
            alt="Degusto hero"
            fill
            className="object-cover object-top lg:object-cover xl:object-contain xl:object-top"
            priority
            loading="eager"
            sizes="100vw"
          />
          </div>
        </div>
        <ProjectGreenStripes />
        <UniversalHeader spacerBackgroundClassName="bg-[#F66812]" />

        {heroProduct ? (
          <div className={`relative z-20 mt-14 w-full overflow-visible lg:mt-16 ${STOREFRONT_DESKTOP_SECTION_CLASS}`}>
            <HomeDailyOfferHeroCard
              product={heroProduct}
              offerBadgeSrc={assets.offerBadge}
              hotIconSrc={assets.productCardHot}
              greensIconSrc={assets.productCardRibbon}
              starIconSrc={assets.productCardStar}
              addToCartIconSrc={assets.productCardAddToCart}
            />
          </div>
        ) : null}
      </section>

      <section
        className={`${HOME_DESKTOP_SPECIAL_OFFERS_SECTION_STACKING_CLASS} min-h-[520px] w-full rounded-t-[40px] bg-[#0c0d12] pb-14 pt-6 lg:min-h-[640px] xl:min-h-[700px]`}
      >
        <div className={STOREFRONT_DESKTOP_SECTION_CLASS}>
          <div
            className={`${HOME_DESKTOP_SPECIAL_OFFERS_HEADER_STACKING_CLASS} flex flex-col gap-6 pt-[70px] sm:flex-row sm:items-end sm:justify-between`}
          >
            <h2
              className={`relative z-40 text-4xl font-black text-white md:text-6xl ${armenianHeadingClassName}`}
            >
              <span className="text-[#f66913]">{t('home.figma.desktop.specialOffersTitleAccent')}</span>
              {t('home.figma.desktop.specialOffersTitleMain')}
            </h2>
            <ViewMoreButton href="/shop" size="lg" className="relative z-40 shrink-0">
              {t('home.figma.desktop.moreButton')} →
            </ViewMoreButton>
          </div>
          {specialOfferProducts.length > 0 ? (
            <div className="mt-20 overflow-x-auto pb-8 scrollbar-hide">
              <div className="mx-auto flex w-max max-w-full flex-nowrap justify-start gap-[10px] xl:justify-center">
                {specialOfferProducts.map((item) => (
                  <NewsCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-20 text-center text-lg text-white/70">
              {t('home.featured_products.noProducts')}
            </p>
          )}
        </div>
      </section>

      <div className="bg-black">
        <section className={`rounded-t-[40px] pb-20 pt-10 ${HOME_DESKTOP_CATEGORY_SURFACE_CLASS}`}>
          <div className={STOREFRONT_DESKTOP_SECTION_CLASS}>
            <h2
              className={`mb-8 text-5xl font-black text-black md:text-6xl ${armenianHeadingClassName}`}
            >
              {t('home.figma.desktop.categoriesTitle')}
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((item) => (
                <CategoryCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </section>
      </div>
      <Footer outerBackgroundClassName={HOME_DESKTOP_CATEGORY_SURFACE_CLASS} />
    </div>
  );
}
