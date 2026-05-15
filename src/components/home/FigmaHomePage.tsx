'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { KeyboardEvent, MouseEvent } from 'react';
import { FigmaHomePageMobile } from './FigmaHomePageMobile';
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
import { mirageExpandedFont } from '@/fonts/mirage-expanded-font';

const assets = {
  heroBg: '/api/r2/hero/20260512-tOKhBzyB6u.png',
  offerBadge: '/api/r2/assets/20260512-3dEN1cAZhG.svg',
  product: '/api/r2/product/20260512-5XM6tLjCRv.png',
  productCardImage: '/api/r2/product/20260512-D3w_teddze.png',
  productCardAddToCart: '/api/r2/product/20260512-g67zkm13ZH.svg',
  productCardHot: '/api/r2/product/20260512-dWv7-ZfxP1.svg',
  productCardRibbon: '/api/r2/product/20260512-lmzrYlGD39.svg',
  productCardStar: '/api/r2/product/20260512-7jf6Wihrew.svg',
  categorySoup: '/api/r2/category/20260512-27SeUi_ujs.png',
  categorySalad: '/api/r2/category/20260512-Np6RG2GuNi.png',
  categoryShawarma: '/api/r2/category/20260512-UOlekxqQyh.png',
  categoryPizza: '/api/r2/category/20260512-j5QKmShMEM.png',
};

export type HomeFeaturedProduct = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  price: number | null;
  oldPrice: number | null;
  image: string | null;
  discountPercent: number | null;
  inStock?: boolean;
  defaultVariantId?: string | null;
  supportsSpicy?: boolean;
  supportsGreens?: boolean;
};

export type HomeCategoryItem = {
  id: string;
  slug: string;
  title: string;
  count: number;
  image: string;
};

const fallbackFeaturedProducts: HomeFeaturedProduct[] = [
  {
    id: 'featured-fallback-1',
    slug: 'products',
    title: 'Double Cheeseburger',
    subtitle: 'Բուրգեր',
    price: 1200,
    oldPrice: 1500,
    image: assets.product,
    discountPercent: 30,
    supportsSpicy: true,
    supportsGreens: true,
  },
];

const fallbackCategories: HomeCategoryItem[] = [
  { id: 'cat-fallback-1', slug: 'soups', title: 'Ապուրներ եւ տաք ուտեստներ', count: 78, image: assets.categorySoup },
  { id: 'cat-fallback-2', slug: 'salads', title: 'Աղցաններ', count: 41, image: assets.categorySalad },
  { id: 'cat-fallback-3', slug: 'shawarma', title: 'Շաուրմա', count: 18, image: assets.categoryShawarma },
  { id: 'cat-fallback-4', slug: 'pizza', title: 'Պիցցա', count: 44, image: assets.categoryPizza },
];

/** Desktop home categories block surface; footer outer wrapper uses the same for a continuous edge. */
const HOME_DESKTOP_CATEGORY_SURFACE_CLASS = 'bg-[#e6e6e8]';

function NewsCard({ item }: { item: HomeFeaturedProduct }) {
  const { t } = useTranslation();
  const currency = useCurrency();
  const router = useRouter();
  const keepCurrencySymbolAttached = (value: string): string => value.replace(/\s+(\S+)$/u, '\u00A0$1');
  const hasDiscount = typeof item.discountPercent === 'number' && item.discountPercent > 0;
  const discountPercent = typeof item.discountPercent === 'number' ? Math.round(item.discountPercent) : null;
  const imageSrc = item.image || assets.product;
  const title =
    item.title === 'Double Cheeseburger' ? t('home.figma.mobile.product.title') : (item.title || t('home.figma.mobile.product.title'));
  const subtitle = item.subtitle || t('home.figma.mobile.product.subtitle');
  const formattedPrice = keepCurrencySymbolAttached(formatPrice(item.price || 0, currency));
  const formattedOldPrice = item.oldPrice ? keepCurrencySymbolAttached(formatPrice(item.oldPrice, currency)) : null;
  const mainPriceClassName = formattedPrice.length > 12 ? 'text-[18px]' : 'text-[20px]';
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
  const openProduct = () => {
    router.push(productHref);
  };
  const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    openProduct();
  };

  const handleAddToCart = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const button = event.currentTarget as HTMLElement;
    const card = button.closest('[data-home-product-card]');
    const origin =
      (card?.querySelector('[data-product-fly-origin]') as HTMLElement | null) ?? button;
    void addToCart({ origin, imageUrl: item.image });
  };

  const handleWishlistToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent(productHref)}`);
      return;
    }
    void toggleWishlist();
  };

  return (
    <article
      data-home-product-card
      className="relative h-[284px] w-[236px] shrink-0 rounded-[20px] border-[1.5px] border-[#dedede] bg-white cursor-pointer transition-shadow hover:shadow-md"
      onClick={openProduct}
      onKeyDown={handleCardKeyDown}
      role="link"
      tabIndex={0}
      aria-label={title}
    >
      <div data-product-fly-origin className="absolute left-1/2 top-1 h-[147px] w-[227px] -translate-x-1/2">
        <img src={imageSrc} alt={title} className="h-full w-full rounded-[18px] object-cover" />
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
        className={`absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border shadow-md transition-colors sm:h-10 sm:w-10 ${
          isInWishlist
            ? 'border-red-600 bg-red-600 text-white hover:bg-red-700'
            : 'border-[#dedede]/90 bg-white/95 text-gray-700 hover:bg-white'
        }`}
        title={
          isInWishlist ? t('common.messages.removedFromWishlist') : t('common.messages.addedToWishlist')
        }
        aria-label={
          isInWishlist ? t('common.ariaLabels.removeFromWishlist') : t('common.ariaLabels.addToWishlist')
        }
      >
        <WishlistHeartIcon filled={isInWishlist} size={18} />
      </button>
      <div className="absolute left-[14px] top-[170px] flex items-center gap-[6px]">
        <img src={assets.productCardStar} alt="" className="h-5 w-5 object-contain" />
        <p className="text-base font-medium leading-[1.35] text-[rgba(60,47,47,0.62)]">4.7</p>
      </div>
      <div className="absolute left-[14px] top-[194px] w-[130px]">
        <h3 className="text-base font-bold leading-[1.05] text-[#3c2f2f]">
          <span className="block max-h-[34px] overflow-hidden break-words">{title}</span>
        </h3>
        <p className="mt-1 overflow-hidden truncate text-base font-medium leading-none text-[#a1a1a1]">{subtitle}</p>
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
        className="absolute -bottom-[25px] left-1/2 inline-flex h-[52px] w-[51px] -translate-x-1/2 items-center justify-center"
      >
        <img src={assets.productCardAddToCart} alt={t('common.buttons.addToCart')} className="h-[52px] w-[51px] object-contain" />
      </button>
    </article>
  );
}

function CategoryCard({ item }: { item: HomeCategoryItem }) {
  return (
    <Link
      href={getHomeCategoryHref(item)}
      className="block rounded-[22px] bg-[#0c0d12] p-4 transition-transform hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f66913]"
      aria-label={item.title}
    >
      <h3 className="min-h-[56px] text-2xl font-black leading-tight text-white">{item.title}</h3>
      <p className="mb-2 mt-1 text-sm text-white/80">({item.count} ապրանք)</p>
      <img src={item.image} alt={item.title} className="mx-auto h-[190px] w-full max-w-[240px] object-contain" />
    </Link>
  );
}

export function FigmaHomePage({
  featuredProducts,
  categories,
}: {
  featuredProducts: HomeFeaturedProduct[];
  categories: HomeCategoryItem[];
}) {
  const { t, lang } = useTranslation();
  const currency = useCurrency();
  const router = useRouter();
  const homeFeaturedProducts = featuredProducts.length > 0 ? featuredProducts : fallbackFeaturedProducts;
  const homeCategories = categories.length > 0 ? categories : fallbackCategories;
  const heroProduct = homeFeaturedProducts[0];
  const heroProductTitle =
    heroProduct?.title === 'Double Cheeseburger'
      ? t('home.figma.mobile.product.title')
      : (heroProduct?.title || t('home.figma.mobile.product.title'));
  const heroProductSubtitle = heroProduct?.subtitle || t('home.figma.mobile.product.subtitle');
  const heroProductHref = `/products/${heroProduct?.slug || 'products'}`;
  const { isLoggedIn } = useAuth();
  const heroForWishlist = heroProduct ?? fallbackFeaturedProducts[0];
  const { isInWishlist: heroInWishlist, toggleWishlist: toggleHeroWishlist } = useWishlist(heroForWishlist.id);
  const openHeroProduct = () => {
    router.push(heroProductHref);
  };
  const handleHeroProductKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    openHeroProduct();
  };

  const handleHeroWishlistToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent(heroProductHref)}`);
      return;
    }
    void toggleHeroWishlist();
  };

  return (
    <>
      <div className="lg:hidden">
        <FigmaHomePageMobile categories={homeCategories} />
      </div>
      <div className="hidden min-h-screen overflow-x-hidden bg-[var(--project-color)] lg:block">
      <section className="relative w-full overflow-hidden bg-[var(--project-color)] pb-56 pt-8 lg:h-[930px] lg:pb-0 lg:[aspect-ratio:231/130]">
        <img
          src={assets.heroBg}
          alt="Degusto hero"
          className="absolute inset-x-0 top-[92px] h-[900px] w-full object-contain object-top lg:h-full"
          loading="eager"
          fetchPriority="high"
          decoding="sync"
        />
        <ProjectGreenStripes />
        <UniversalHeader spacerBackgroundClassName="bg-[#F66812]" />

        <div className="relative z-10 mx-auto mt-14 w-full max-w-[1450px] px-4 lg:mt-16 lg:px-6">
          <article
            className="relative h-[284px] w-[236px] cursor-pointer sm:ml-[45px]"
            onClick={openHeroProduct}
            onKeyDown={handleHeroProductKeyDown}
            role="link"
            tabIndex={0}
            aria-label={heroProductTitle}
          >
            <div className="absolute inset-0 rounded-[20px] bg-white shadow-xl" />
            <div className="absolute left-1/2 top-[5px] h-[147px] w-[227px] -translate-x-1/2">
              <img src={heroProduct?.image || assets.productCardImage} alt={t('home.figma.mobile.dailyOfferImageAlt')} className="h-full w-full rounded-[18px] object-cover" />
              <HomeProductFoodAttributeBadges
                variant="desktop-hero"
                supportsSpicy={heroProduct?.supportsSpicy ?? false}
                supportsGreens={heroProduct?.supportsGreens ?? false}
                hotIconSrc={assets.productCardHot}
                greensIconSrc={assets.productCardRibbon}
              />
            </div>
            <button
              type="button"
              onClick={handleHeroWishlistToggle}
              className={`absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border shadow-md transition-colors sm:h-10 sm:w-10 ${
                heroInWishlist
                  ? 'border-red-600 bg-red-600 text-white hover:bg-red-700'
                  : 'border-[#dedede]/90 bg-white/95 text-gray-700 hover:bg-white'
              }`}
              title={
                heroInWishlist ? t('common.messages.removedFromWishlist') : t('common.messages.addedToWishlist')
              }
              aria-label={
                heroInWishlist ? t('common.ariaLabels.removeFromWishlist') : t('common.ariaLabels.addToWishlist')
              }
            >
              <WishlistHeartIcon filled={heroInWishlist} size={18} />
            </button>
            <div className="absolute left-[14px] top-[172px] flex items-center gap-1.5">
              <img src={assets.productCardStar} alt="" className="h-5 w-5 object-contain" />
              <p className="text-base font-medium leading-none text-[rgba(60,47,47,0.62)]">4.7</p>
            </div>
            <div className="absolute left-[14px] top-[194px] w-[130px]">
              <h2 className="text-base font-bold leading-none text-[#3c2f2f]">
                <span className="block">{heroProductTitle}</span>
              </h2>
              <p className="mt-1 text-base font-medium leading-none text-[#a1a1a1]">{heroProductSubtitle}</p>
            </div>
            <span className="absolute right-[12px] top-[165px] inline-flex items-center rounded-[60px] bg-[#ff7f20] px-[17px] py-[8px] text-sm font-bold leading-none text-black">
              -{Math.round(heroProduct?.discountPercent || 30)}%
            </span>
            <span className="absolute right-[14px] top-[228px] font-['Montserrat_arm','Montserrat',sans-serif] text-[22px] font-[1000] leading-none tracking-[-0.3px] text-[#3c2f2f]">
              {formatPrice(heroProduct?.price || 1200, currency)}
            </span>
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              className="absolute bottom-[-25px] left-1/2 inline-flex h-[52px] w-[51px] -translate-x-1/2 items-center justify-center"
            >
              <img src={assets.productCardAddToCart} alt="Add to cart" className="h-[52px] w-[51px] object-contain" />
            </button>
            <div className="absolute -right-[88px] -top-[46px] h-[132px] w-[132px]">
              <img src={assets.offerBadge} alt="" className="absolute inset-0 h-full w-full object-contain" />
              <div
                className={`absolute inset-0 flex items-center justify-center text-center font-black text-white ${
                  lang === 'ru' ? 'text-[11px] leading-[1.05]' : 'text-[16px] leading-[1.1]'
                }`}
              >
                <span className={`whitespace-pre-line ${lang === 'ru' ? '-translate-x-[4px] max-w-[72px]' : ''}`}>
                  {t('home.figma.mobile.dailyOfferTitle')}
                </span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="h-[700px] w-full rounded-t-[40px] bg-[#0c0d12] pb-14 pt-6">
        <div className="w-full px-4 md:px-8 ">
          <div className="flex items-center justify-between">
            <h2
              className={`translate-x-[70px] translate-y-[70px] text-4xl font-black text-white md:text-6xl${
                lang === 'hy' ? ` ${mirageExpandedFont.className}` : ''
              }`}
            >
              <span className="text-[#f66913]">{t('home.figma.desktop.specialOffersTitleAccent')}</span>
              {t('home.figma.desktop.specialOffersTitleMain')}
            </h2>
            <Link href="/shop" className="translate-x-[-115px] translate-y-[70px] inline-block rounded-full bg-[#ff7f20] px-6 py-4 text-lg font-bold text-white">
              {t('home.figma.desktop.moreButton')} →
            </Link>
          </div>
          <div className="mt-[150px] flex flex-wrap justify-center gap-[10px] pb-8">
            {homeFeaturedProducts.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>

      <div className="bg-black">
        <section className={`rounded-t-[40px] px-4 pb-20 pt-10 md:px-8 lg:px-12 ${HOME_DESKTOP_CATEGORY_SURFACE_CLASS}`}>
          <div className="mx-auto max-w-[1280px]">
            <h2
              className={`mb-8 text-5xl font-black text-black md:text-6xl${
                lang === 'hy' ? ` ${mirageExpandedFont.className}` : ''
              }`}
            >
              {t('home.figma.desktop.categoriesTitle')}
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {homeCategories.map((item) => (
                <CategoryCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </section>
      </div>
      <Footer outerBackgroundClassName={HOME_DESKTOP_CATEGORY_SURFACE_CLASS} />
      </div>
    </>
  );
}
