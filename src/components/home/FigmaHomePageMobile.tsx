'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MobileBottomNavigation } from './MobileBottomNavigation';
import { LanguageCurrencySwitcher } from '../LanguageCurrencySwitcher';
import { useTranslation } from '../../lib/i18n-client';
import { mirageExpandedFont } from '@/fonts/mirage-expanded-font';
import { formatPrice } from '../../lib/currency';
import { useCurrency } from '../hooks/useCurrency';
import { getHomeCategoryHref } from './homeCategoryLinks';

const mobileAssets = {
  logo: '/api/r2/logo/20260512-SkrFbnskhy.png',
  callCircle: '/api/r2/assets/20260512-oiO5lHqN_7.svg',
  callIcon: '/api/r2/icons/20260512-EM1Vpadi-M.svg',
  switcherIcon: '/api/r2/icons/20260512-qZTYh7B1Ko.svg',
  switcherArrow: '/api/r2/assets/20260512-XFFAtVhXmC.svg',
  searchIcon: '/api/r2/icons/20260512-6InNAfSqmg.svg',
  searchFilterButton: '/api/r2/search/20260512-X-wm1R4kZC.svg',
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
  bottomNavBackground: '/api/r2/navigation/20260512-Dgnu58TYo3.svg',
  bottomNavHome: '/api/r2/navigation/20260512-zomFTx64fK.svg',
  bottomNavCart: '/api/r2/navigation/20260512-uAd4OmdwhO.svg',
  bottomNavFavorite: '/api/r2/navigation/20260512-rq6TGa1j4e.svg',
  bottomNavProfile: '/api/r2/navigation/20260512-0QvW2JXVIb.svg',
  bottomNavShop: '/api/r2/navigation/20260512-NuBb07Yghg.svg',
};

type MobileCategory = {
  id: string;
  slug: string;
  title?: string;
  titleKey: string;
  image: string;
  framed?: boolean;
};

type MobileProduct = {
  id: string;
  titleKey: string;
  subtitleKey: string;
  price: number;
  oldPrice: number;
  supportsSpicy?: boolean;
  supportsGreens?: boolean;
};

function getMobilePriceSizeClass(formattedPrice: string): string {
  const length = formattedPrice.length;

  if (length >= 14) {
    return 'text-[13px]';
  }

  if (length >= 11) {
    return 'text-sm';
  }

  return 'text-base';
}

const mobileCategories: MobileCategory[] = [
  { id: 'pizza', slug: 'pizza', titleKey: 'home.figma.mobile.category.pizza', image: mobileAssets.categoryPizza, framed: true },
  { id: 'burger', slug: 'burger', titleKey: 'home.figma.mobile.category.burger', image: mobileAssets.categoryBurger },
  { id: 'sushi', slug: 'sushi', titleKey: 'home.figma.mobile.category.sushi', image: mobileAssets.categorySushi },
  { id: 'salad', slug: 'salads', titleKey: 'home.figma.mobile.category.salad', image: mobileAssets.categorySalad },
  { id: 'soup', slug: 'soups', titleKey: 'home.figma.mobile.category.soup', image: mobileAssets.categorySoup },
];

const mobileProducts: MobileProduct[] = Array.from({ length: 12 }, (_, index) => ({
  id: `mobile-product-${index + 1}`,
  titleKey: 'home.figma.mobile.product.title',
  subtitleKey: 'home.figma.mobile.product.subtitle',
  price: 1200,
  oldPrice: 1200,
  supportsSpicy: false,
  supportsGreens: false,
}));

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
    <div className="space-y-3">
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

function MobileDailyOffer() {
  const { t } = useTranslation();
  const currency = useCurrency();
  return (
    <article className="relative mx-auto h-32 w-[356px] overflow-hidden rounded-[20px]">
      <div className="absolute left-0 top-0 h-full w-[182px] bg-[#f66a13]" />
      <img src={mobileAssets.dailyOfferPizza} alt={t('home.figma.mobile.dailyOfferImageAlt')} className="absolute right-0 top-0 h-full w-[174px] object-cover" />
      <h3 className="absolute left-[11px] top-[10px] whitespace-pre-line text-[20px] font-bold leading-[21px] text-white">
        {t('home.figma.mobile.dailyOfferTitle')}
      </h3>
      <p className="absolute left-[11px] top-[57px] w-[102px] text-sm font-medium leading-[1.15] text-[rgba(255,255,255,0.89)]">
        {t('home.figma.mobile.product.title')}
      </p>
      <p className="absolute left-[11px] top-24 text-base font-black leading-none text-white">{formatPrice(1200, currency)}</p>
      <span className="absolute left-[255px] top-[15px] inline-flex h-[25px] w-[65px] items-center justify-center rounded-[60px] bg-white text-xs font-bold text-black">
        -30%
      </span>
      <button type="button" className="absolute left-[128px] top-[76px] inline-flex h-[41.669px] w-[41.096px] items-center justify-center">
        <img src={mobileAssets.dailyOfferAddToCart} alt={t('common.buttons.addToCart')} className="h-[41.7px] w-[41.1px] object-contain" />
      </button>
    </article>
  );
}

function MobileProductCard({ product }: { product: MobileProduct }) {
  const { t } = useTranslation();
  const currency = useCurrency();
  const formattedPrice = formatPrice(product.price, currency);
  const formattedOldPrice = formatPrice(product.oldPrice, currency);
  const priceSizeClass = getMobilePriceSizeClass(formattedPrice);
  const oldPriceSizeClass = getMobilePriceSizeClass(formattedOldPrice);
  const supportsSpicy = product.supportsSpicy ?? false;
  const supportsGreens = product.supportsGreens ?? false;
  const greensTopClass = supportsSpicy ? 'top-[38px]' : 'top-[11px]';

  return (
    <article className="relative h-[248px] rounded-[20px] bg-[#ffeacc]">
      <div className="absolute left-1 right-1 top-[5px] h-[143px] overflow-hidden rounded-[18px]">
        <img src={mobileAssets.productImage} alt={t(product.titleKey)} className="h-full w-full object-cover" />
      </div>
      {supportsSpicy ? (
        <div className="absolute left-[9px] top-[11px] flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#ff2b2e]">
          <img src={mobileAssets.productHot} alt="" className="h-[13px] w-[13px] -rotate-[13deg] object-contain" />
        </div>
      ) : null}
      {supportsGreens ? (
        <img
          src={mobileAssets.productRibbon}
          alt=""
          className={`absolute left-[9px] h-[22px] w-[22px] object-contain ${greensTopClass}`}
        />
      ) : null}

      <div className="absolute left-[9px] top-[150px] flex items-center gap-1.5">
        <img src={mobileAssets.productStar} alt="" className="h-[19px] w-[19px] object-contain" />
        <p className="text-sm font-medium leading-none text-[rgba(60,47,47,0.62)]">4.7</p>
      </div>

      <div className="absolute left-[9px] top-[172px] w-[118px]">
        <h3 className="text-sm font-bold leading-[1.15] text-[#3c2f2f]">{t(product.titleKey)}</h3>
        <p className="mt-[2px] text-sm font-medium leading-none text-[#a1a1a1]">{t(product.subtitleKey)}</p>
      </div>

      <span className="absolute right-0 top-[112px] inline-flex h-[25px] w-[65px] items-center justify-center rounded-[60px] bg-[#ff7f20] text-xs font-bold leading-none text-black">
        -30%
      </span>
      <div className="absolute right-2 top-[192px] flex max-w-[76px] flex-col items-end text-right">
        <p className={`w-full break-words font-black leading-tight tabular-nums text-[#3c2f2f] ${priceSizeClass}`}>{formattedPrice}</p>
        <p className={`w-full break-words font-medium leading-tight tabular-nums text-[#3c2f2f] line-through ${oldPriceSizeClass}`}>
          {formattedOldPrice}
        </p>
      </div>

      <button type="button" className="absolute -bottom-[14px] left-1/2 inline-flex h-[42px] w-[42px] -translate-x-1/2 items-center justify-center">
        <img src={mobileAssets.productAddToCart} alt={t('common.buttons.addToCart')} className="h-[42px] w-[42px] object-contain" />
      </button>
    </article>
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
};

export function FigmaHomePageMobile({ categories = [] }: FigmaHomePageMobileProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { t, lang } = useTranslation();
  const displayCategories =
    categories.length > 0
      ? categories.slice(0, mobileCategories.length).map((category, index) => ({
          ...category,
          titleKey: mobileCategories[index]?.titleKey ?? 'common.navigation.categories',
          framed: index === 0,
        }))
      : mobileCategories;
  const categoriesTitleClassName = lang === 'hy' ? mirageExpandedFont.className : undefined;

  const handleOpenShopPicker = () => {
    router.push('/shop');
  };

  return (
    <div className="relative mx-auto min-h-screen w-full max-w-[393px] overflow-hidden bg-[var(--project-color)]">
      <div className="absolute -left-[210px] -top-[123px] h-[434px] w-[418px] rounded-full border-[80px] border-[#3E573D]" />
      <div className="absolute -right-[160px] -top-[184px] h-[320px] w-[360px] rounded-full border-[70px] border-[#3E573D]" />

      <header className="relative z-10 px-[11px] pt-[58px]">
        <div className="flex translate-y-[20px] items-start justify-between">
          <img src={mobileAssets.logo} alt="Degusto" className="h-[46px] w-[129px] object-contain" />
          <div className="flex items-center gap-1">
            <button type="button" className="relative inline-flex h-12 w-12 items-center justify-center">
              <img src={mobileAssets.callCircle} alt="" className="absolute inset-0 h-12 w-12 object-contain" />
              <img src={mobileAssets.callIcon} alt="Call" className="relative h-[23px] w-[23px] object-contain" />
            </button>
            <LanguageCurrencySwitcher
              variant="mobile"
              iconSrc={mobileAssets.switcherIcon}
              arrowSrc={mobileAssets.switcherArrow}
            />
          </div>
        </div>

        <div className="relative mt-[8px] h-12 translate-y-[20px] rounded-[30px] bg-white shadow-[0px_4px_4px_0px_rgba(0,0,0,0.05)]">
          <img src={mobileAssets.searchIcon} alt="" className="absolute left-[15px] top-1/2 h-[17px] w-[17px] -translate-y-1/2 object-contain" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
            }}
            placeholder={t('common.buttons.search')}
            className="h-full w-full rounded-[30px] bg-transparent pl-[39px] pr-[58px] text-[15px] leading-6 text-black outline-none placeholder:text-[#abb7c2]"
          />
          <button type="button" className="absolute right-[7px] top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center">
            <img src={mobileAssets.searchFilterButton} alt={t('products.header.filters')} className="h-10 w-10 object-contain" />
          </button>
        </div>
      </header>

      <main className="relative z-10 mt-[87px] rounded-t-[30px] bg-white px-[19px] pb-[110px] pt-8">
        <MobileCategoryStrip
          categories={displayCategories}
          categoriesTitleClassName={categoriesTitleClassName}
        />
        <div className="mt-[22px]">
          <MobileDailyOffer />
        </div>
        <div className="mt-[19px]">
          <MobileCategorySliderIndicator />
        </div>

        <div className="mt-[30px] space-y-[22px]">
          <MobileSectionHeader title={t('products.categoryNavigation.newArrivals')} />
          <div className="grid grid-cols-2 gap-x-[14px] gap-y-[22px]">
            {mobileProducts.slice(0, 4).map((product) => (
              <MobileProductCard key={`new-${product.id}`} product={product} />
            ))}
          </div>
        </div>

        <div className="mt-[30px] space-y-[22px]">
          <MobileSectionHeader
            title={t('common.navigation.categories')}
            titleClassName={categoriesTitleClassName}
          />
          <div className="grid grid-cols-2 gap-x-[14px] gap-y-[22px]">
            {mobileProducts.slice(4, 8).map((product) => (
              <MobileProductCard key={`cat-a-${product.id}`} product={product} />
            ))}
          </div>
        </div>

        <div className="mt-[30px] space-y-[22px]">
          <MobileSectionHeader
            title={t('common.navigation.categories')}
            titleClassName={categoriesTitleClassName}
          />
          <div className="grid grid-cols-2 gap-x-[14px] gap-y-[22px]">
            {mobileProducts.slice(8, 12).map((product) => (
              <MobileProductCard key={`cat-b-${product.id}`} product={product} />
            ))}
          </div>
        </div>
      </main>
      <MobileBottomNavigation
        assets={{
          bottomNavBackground: mobileAssets.bottomNavBackground,
          bottomNavShop: mobileAssets.bottomNavShop,
          bottomNavHome: mobileAssets.bottomNavHome,
          bottomNavCart: mobileAssets.bottomNavCart,
          bottomNavFavorite: mobileAssets.bottomNavFavorite,
          bottomNavProfile: mobileAssets.bottomNavProfile,
        }}
        onShopClick={handleOpenShopPicker}
      />
    </div>
  );
}
