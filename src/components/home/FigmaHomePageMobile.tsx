'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LanguageCurrencySwitcher } from '../LanguageCurrencySwitcher';
import { useTranslation } from '../../lib/i18n-client';
import { mirageExpandedFont } from '@/fonts/mirage-expanded-font';
import { formatPrice } from '../../lib/currency';
import { useCurrency } from '../hooks/useCurrency';
import { getHomeCategoryHref } from './homeCategoryLinks';
import type { HomeFeaturedProduct } from './FigmaHomePage';
import { ShopMobileProductCard } from './ShopMobileProductCard';
import type { MenuCard } from './menu-types';
import {
  MOBILE_FIGMA_HEADER_HORIZONTAL_INSET_CLASS,
  MOBILE_FIGMA_HEADER_SEARCH_STACKING_CLASS,
  MOBILE_FIGMA_HEADER_STACKING_CLASS,
  MOBILE_FIGMA_HEADER_TOP_ROW_STACKING_CLASS,
  MOBILE_FIGMA_STOREFRONT_ASSETS,
} from '@/constants/mobile-figma-storefront';
import { MobileFriendlyInput } from '@/components/mobile/MobileFriendlyInput';

const MOBILE_HOME_SECTION_PRODUCT_COUNT = 4;
const MOBILE_HOME_PRODUCT_GRID_TOTAL =
  MOBILE_HOME_SECTION_PRODUCT_COUNT * 3;

const mobileAssets = {
  ...MOBILE_FIGMA_STOREFRONT_ASSETS,
  categoryFrame: '/api/r2/category/20260512-uqGTJqCe88.svg',
  categoryPizza: '/api/r2/category/20260512-w5zllSSAIo.png',
  categoryBurger: '/api/r2/category/20260512-1bbwOOTncy.png',
  categorySushi: '/api/r2/category/20260512-fVYeOn2udd.png',
  categorySalad: '/api/r2/category/20260512-5hRi9b8irf.png',
  categorySoup: '/api/r2/category/20260512-n-C21lLLfT.png',
  dailyOfferBackground: '/api/r2/assets/20260512-Qr_pLoFG6x.svg',
  dailyOfferPizza: '/api/r2/assets/20260512-84Sj1kTqGo.png',
  dailyOfferAddToCart: '/api/r2/assets/20260512-AiLSWk8lFo.svg',
  productImage: '/api/r2/product/20260512-lbgLHc4bPu.png',
  productHot: '/api/r2/product/20260512-Y6Ue4PwD26.svg',
  productRibbon: '/api/r2/product/20260512-vCDQ1I3ZtJ.svg',
  productStar: '/api/r2/product/20260512-4fThctFUPS.svg',
  productAddToCart: '/api/r2/product/20260512-N6b8G5qARR.svg',
};

type MobileCategory = {
  id: string;
  slug: string;
  title?: string;
  titleKey: string;
  image: string;
  framed?: boolean;
};

function homeFeaturedProductToMenuCard(product: HomeFeaturedProduct): MenuCard {
  const price = product.price ?? 0;
  const oldPrice = product.oldPrice ?? price;
  const discountPercent =
    typeof product.discountPercent === 'number' && product.discountPercent > 0
      ? Math.round(product.discountPercent)
      : 0;
  const discount = discountPercent > 0 ? `-${discountPercent}%` : '';

  return {
    id: product.id,
    slug: product.slug,
    titleKey: 'home.figma.mobile.product.title',
    subtitleKey: 'home.figma.mobile.product.subtitle',
    title: product.title,
    subtitle: product.subtitle,
    category: product.subtitle,
    image: product.image,
    price,
    oldPrice,
    discount,
    discountPercent: product.discountPercent,
    inStock: product.inStock,
    defaultVariantId: product.defaultVariantId,
    supportsSpicy: product.supportsSpicy,
    supportsGreens: product.supportsGreens,
  };
}

function resolveMobileHomeDiscountPercent(product: HomeFeaturedProduct): number {
  const price = product.price ?? 0;
  const oldPrice = product.oldPrice ?? 0;
  const calculated =
    oldPrice > price && oldPrice > 0
      ? Math.round(((oldPrice - price) / oldPrice) * 100)
      : 0;
  const fromDb =
    typeof product.discountPercent === 'number' && product.discountPercent > 0
      ? Math.round(product.discountPercent)
      : 0;
  return calculated || fromDb;
}

const mobileCategories: MobileCategory[] = [
  { id: 'pizza', slug: 'pizza', titleKey: 'home.figma.mobile.category.pizza', image: mobileAssets.categoryPizza, framed: true },
  { id: 'burger', slug: 'burger', titleKey: 'home.figma.mobile.category.burger', image: mobileAssets.categoryBurger },
  { id: 'sushi', slug: 'sushi', titleKey: 'home.figma.mobile.category.sushi', image: mobileAssets.categorySushi },
  { id: 'salad', slug: 'salads', titleKey: 'home.figma.mobile.category.salad', image: mobileAssets.categorySalad },
  { id: 'soup', slug: 'soups', titleKey: 'home.figma.mobile.category.soup', image: mobileAssets.categorySoup },
];

/** Inset for product grid sections and the top category strip (aligns section titles). */
const MOBILE_HOME_PRODUCT_SECTION_HORIZONTAL_INSET_CLASS = 'px-3';

function MobileSectionHeader({ title, titleClassName }: { title: string; titleClassName?: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between">
      <h2
        className={`text-base font-semibold leading-5 text-black${titleClassName ? ` ${titleClassName}` : ''}`}
      >
        {title}
      </h2>
      <Link href="/shop" className="text-base font-bold leading-6 text-[#f66a13]">
        {t('common.buttons.viewMore')} {'>'}
      </Link>
    </div>
  );
}

function MobileCategoryStrip({
  categories,
  categoriesTitleClassName,
}: {
  categories: MobileCategory[];
  categoriesTitleClassName?: string;
}) {
  const { t } = useTranslation();
  return (
    <div className={'space-y-3 ' + MOBILE_HOME_PRODUCT_SECTION_HORIZONTAL_INSET_CLASS}>
      <MobileSectionHeader
        title={t('common.navigation.categories')}
        titleClassName={categoriesTitleClassName}
      />
      <div className="grid grid-cols-5 gap-2 pb-1">
        {categories.map((category) => {
          const title = category.title ?? t(category.titleKey);

          return (
          <Link
            key={category.id}
            href={getHomeCategoryHref({ slug: category.slug, title })}
            className="min-w-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f66a13]"
            aria-label={title}
          >
            <div className="relative mx-auto flex h-[72px] w-[48px] items-center justify-center rounded-[24px] bg-[#090909]">
              {category.framed ? (
                <img src={mobileAssets.categoryFrame} alt="" className="absolute inset-0 h-full w-full object-contain" />
              ) : null}
              <img src={category.image} alt={title} className="relative h-[42px] w-[40px] rounded-[10px] object-cover" />
            </div>
            <p className="mt-[6px] text-center text-xs leading-5 text-black">{title}</p>
          </Link>
          );
        })}
      </div>
      <div className="pt-1">
        <MobileSliderIndicator />
      </div>
    </div>
  );
}

function MobileDailyOffer({ product }: { product: HomeFeaturedProduct }) {
  const { t } = useTranslation();
  const currency = useCurrency();
  const router = useRouter();
  const title =
    product.title === 'Double Cheeseburger'
      ? t('home.figma.mobile.product.title')
      : (product.title || t('home.figma.mobile.product.title'));
  const imageSrc = product.image || mobileAssets.dailyOfferPizza;
  const price = product.price ?? 0;
  const discountPercent = resolveMobileHomeDiscountPercent(product);
  const productHref = `/products/${product.slug}`;

  return (
    <article
      className="relative h-32 w-full max-w-full cursor-pointer overflow-hidden rounded-[20px]"
      onClick={() => {
        router.push(productHref);
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') {
          return;
        }
        event.preventDefault();
        router.push(productHref);
      }}
      role="link"
      tabIndex={0}
      aria-label={title}
    >
      <div className="absolute left-0 top-0 h-full w-[51.12%] bg-[#f66a13]" />
      <img src={imageSrc} alt={title} className="absolute right-0 top-0 h-full w-[48.88%] object-cover" />
      <h3 className="absolute left-[11px] top-[10px] whitespace-pre-line text-[20px] font-bold leading-[21px] text-white">
        {t('home.figma.mobile.dailyOfferTitle')}
      </h3>
      <p className="absolute left-[11px] top-[57px] w-[102px] line-clamp-2 text-sm font-medium leading-[1.15] text-[rgba(255,255,255,0.89)]">
        {title}
      </p>
      <p className="absolute left-[11px] top-24 text-base font-black leading-none text-white">
        {formatPrice(price, currency)}
      </p>
      {discountPercent > 0 ? (
        <span className="absolute right-[10px] top-[15px] inline-flex h-[25px] w-[65px] items-center justify-center rounded-[60px] bg-white text-xs font-bold text-black">
          -{discountPercent}%
        </span>
      ) : null}
      <button
        type="button"
        className="absolute left-[35.95%] top-[76px] inline-flex h-[41.669px] w-[41.096px] items-center justify-center"
        onClick={(event) => {
          event.stopPropagation();
          router.push(productHref);
        }}
        aria-label={t('common.buttons.addToCart')}
      >
        <img src={mobileAssets.dailyOfferAddToCart} alt="" className="h-[41.7px] w-[41.1px] object-contain" />
      </button>
    </article>
  );
}

function MobileHomeProductGrid({ products }: { products: HomeFeaturedProduct[] }) {
  if (products.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-x-[14px] gap-y-[22px]">
      {products.map((product) => (
        <ShopMobileProductCard key={product.id} card={homeFeaturedProductToMenuCard(product)} />
      ))}
    </div>
  );
}

function MobileSliderIndicator() {
  return (
    <div className="flex items-center justify-center gap-1">
      <span className="h-1 w-5 rounded-[12px] bg-[#ffeacc]" />
      <span className="h-1 w-5 rounded-[12px] bg-[#ffeacc]" />
      <span className="h-1 w-5 rounded-[12px] bg-[#ff7f20]" />
      <span className="h-1 w-5 rounded-[12px] bg-[#ffeacc]" />
      <span className="h-1 w-5 rounded-[12px] bg-[#ffeacc]" />
    </div>
  );
}

function MobileCategorySliderIndicator() {
  return (
    <div className="flex items-center justify-center gap-1">
      <span className="h-1 w-5 rounded-[12px] bg-[#f66a13]" />
      <span className="h-1 w-5 rounded-[12px] bg-[#ffeacc]" />
      <span className="h-1 w-5 rounded-[12px] bg-[#ffeacc]" />
    </div>
  );
}

type FigmaHomePageMobileProps = {
  categories?: Array<{
    id: string;
    slug: string;
    title: string;
    image: string;
  }>;
  featuredProducts?: HomeFeaturedProduct[];
};

export function FigmaHomePageMobile({
  categories = [],
  featuredProducts = [],
}: FigmaHomePageMobileProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { t, lang } = useTranslation();
  const heroProduct = featuredProducts[0];
  const gridProducts = featuredProducts.slice(0, MOBILE_HOME_PRODUCT_GRID_TOTAL);
  const newArrivalProducts = gridProducts.slice(0, MOBILE_HOME_SECTION_PRODUCT_COUNT);
  const categoryProductsA = gridProducts.slice(
    MOBILE_HOME_SECTION_PRODUCT_COUNT,
    MOBILE_HOME_SECTION_PRODUCT_COUNT * 2
  );
  const categoryProductsB = gridProducts.slice(MOBILE_HOME_SECTION_PRODUCT_COUNT * 2);
  const displayCategories =
    categories.length > 0
      ? categories.slice(0, mobileCategories.length).map((category, index) => ({
          ...category,
          titleKey: mobileCategories[index]?.titleKey ?? 'common.navigation.categories',
          framed: index === 0,
        }))
      : mobileCategories;
  const categoriesTitleClassName = lang === 'hy' ? mirageExpandedFont.className : undefined;

  return (
    <div className="relative min-h-screen w-full overflow-x-clip overflow-y-visible bg-[var(--project-color)]">
      <div className="absolute -left-[210px] -top-[123px] h-[434px] w-[418px] rounded-full border-[80px] border-[#3E573D]" />
      <div className="absolute -right-[160px] -top-[184px] h-[320px] w-[360px] rounded-full border-[70px] border-[#3E573D]" />

      <header
        className={`relative overflow-visible ${MOBILE_FIGMA_HEADER_STACKING_CLASS} ${MOBILE_FIGMA_HEADER_HORIZONTAL_INSET_CLASS} pt-[58px]`}
      >
        <div
          className={`relative overflow-visible ${MOBILE_FIGMA_HEADER_TOP_ROW_STACKING_CLASS} flex translate-y-[20px] items-start justify-between`}
        >
          <img src={mobileAssets.logo} alt="Degusto" className="h-[46px] w-[129px] object-contain" />
          <div className="flex items-center gap-1">
            <button type="button" className="relative inline-flex h-12 w-12 items-center justify-center">
              <img src={mobileAssets.callCircle} alt="" className="absolute inset-0 h-12 w-12 object-contain" />
              <img src={mobileAssets.callIcon} alt="Call" className="relative h-[23px] w-[23px] object-contain" />
            </button>
            <LanguageCurrencySwitcher
              variant="mobile"
              iconSrc={mobileAssets.switcherIcon}
            />
          </div>
        </div>

        <div
          className={`relative ${MOBILE_FIGMA_HEADER_SEARCH_STACKING_CLASS} mt-[8px] h-12 translate-y-[20px] rounded-[30px] bg-white shadow-[0px_4px_4px_0px_rgba(0,0,0,0.05)]`}
        >
          <img
            src={mobileAssets.searchIcon}
            alt=""
            className="absolute left-[15px] top-1/2 h-[17px] w-[17px] -translate-y-1/2 object-contain brightness-0"
          />
          <MobileFriendlyInput
            type="text"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
            }}
            placeholder={t('common.buttons.search')}
            sheetTitle={t('common.buttons.search')}
            className="h-full w-full rounded-[30px] bg-transparent pl-[39px] pr-[58px] text-[15px] leading-6 text-black outline-none placeholder:text-[#abb7c2]"
          />
          <button type="button" className="absolute right-[7px] top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center">
            <img src={mobileAssets.searchFilterButton} alt={t('products.header.filters')} className="h-10 w-10 object-contain" />
          </button>
        </div>
      </header>

      <main className="relative z-10 mt-[87px] rounded-t-[30px] bg-white px-0 pb-[110px] pt-8">
        <MobileCategoryStrip
          categories={displayCategories}
          categoriesTitleClassName={categoriesTitleClassName}
        />
        {heroProduct ? (
          <div className={'mt-[22px] ' + MOBILE_HOME_PRODUCT_SECTION_HORIZONTAL_INSET_CLASS}>
            <MobileDailyOffer product={heroProduct} />
          </div>
        ) : null}
        <div className={'mt-[19px] ' + MOBILE_HOME_PRODUCT_SECTION_HORIZONTAL_INSET_CLASS}>
          <MobileCategorySliderIndicator />
        </div>

        {newArrivalProducts.length > 0 ? (
          <div className={'mt-[30px] space-y-[22px] ' + MOBILE_HOME_PRODUCT_SECTION_HORIZONTAL_INSET_CLASS}>
            <MobileSectionHeader title={t('products.categoryNavigation.newArrivals')} />
            <MobileHomeProductGrid products={newArrivalProducts} />
          </div>
        ) : null}

        {categoryProductsA.length > 0 ? (
          <div className={'mt-[30px] space-y-[22px] ' + MOBILE_HOME_PRODUCT_SECTION_HORIZONTAL_INSET_CLASS}>
            <MobileSectionHeader
              title={t('common.navigation.categories')}
              titleClassName={categoriesTitleClassName}
            />
            <MobileHomeProductGrid products={categoryProductsA} />
          </div>
        ) : null}

        {categoryProductsB.length > 0 ? (
          <div className={'mt-[30px] space-y-[22px] ' + MOBILE_HOME_PRODUCT_SECTION_HORIZONTAL_INSET_CLASS}>
            <MobileSectionHeader
              title={t('common.navigation.categories')}
              titleClassName={categoriesTitleClassName}
            />
            <MobileHomeProductGrid products={categoryProductsB} />
          </div>
        ) : null}
      </main>
    </div>
  );
}
