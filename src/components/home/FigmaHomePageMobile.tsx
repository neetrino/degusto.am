import Link from 'next/link';
import { ViewMoreButton } from '../view-more/ViewMoreButton';
import { t as translateKey } from '@/lib/i18n';
import type { StorefrontLocale } from '@/lib/i18n/locale';
import { montserratArmFont } from '@/fonts/montserrat-arm-font';
import type { HomeCategoryItem, HomeFeaturedProduct } from './home-page-types';
import {
  MOBILE_FIGMA_HEADER_HORIZONTAL_INSET_CLASS,
  MOBILE_FIGMA_HEADER_SEARCH_STACKING_CLASS,
  MOBILE_FIGMA_HEADER_STACKING_CLASS,
  MOBILE_FIGMA_HEADER_TOP_ROW_STACKING_CLASS,
  MOBILE_FIGMA_STOREFRONT_ASSETS,
} from '@/constants/mobile-figma-storefront';
import { r2Asset } from '@/lib/r2-public-url';
import { HomeOptimizedImage } from './HomeOptimizedImage';
import { resolveHomeDailyOfferProduct } from './home-daily-offer';
import {
  buildMobileDisplayCategories,
  sliceMobileHomeProductSections,
  type MobileHomeCategory,
} from './home-mobile-helpers';
import { MobileHomeHeaderSearch } from './MobileHomeHeaderSearch';
import { MobileHomeHeaderActions } from './MobileHomeHeaderActions';
import { MobileHomeProductGrid } from './MobileHomeProductGrid';
import { MobileCategoryCarousel } from './MobileCategoryCarousel';
import { MobileDailyOfferCarousel } from './MobileDailyOfferCarousel';

const mobileAssets = {
  ...MOBILE_FIGMA_STOREFRONT_ASSETS,
  categoryFrame: r2Asset('category/20260512-uqGTJqCe88.svg'),
  dailyOfferAddToCart: r2Asset('assets/20260512-AiLSWk8lFo.svg'),
};

const MOBILE_HOME_PRODUCT_SECTION_HORIZONTAL_INSET_CLASS = 'px-3';

function MobileSectionHeader({
  title,
  titleClassName,
  viewMoreLabel,
}: {
  title: string;
  titleClassName?: string;
  viewMoreLabel: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2
        className={`text-base font-semibold leading-5 text-black${titleClassName ? ` ${titleClassName}` : ''}`}
      >
        {title}
      </h2>
      <ViewMoreButton href="/shop" variant="text">
        {viewMoreLabel} {'>'}
      </ViewMoreButton>
    </div>
  );
}

function MobileCategoryStrip({
  categories,
  categoriesTitle,
  categoriesTitleClassName,
  viewMoreLabel,
  translate,
}: {
  categories: MobileHomeCategory[];
  categoriesTitle: string;
  categoriesTitleClassName?: string;
  viewMoreLabel: string;
  translate: (key: string) => string;
}) {
  const mappedCategories = categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    title: category.title ?? translate(category.titleKey),
    image: category.image,
    framed: category.framed,
  }));

  return (
    <div className={'space-y-3 ' + MOBILE_HOME_PRODUCT_SECTION_HORIZONTAL_INSET_CLASS}>
      <MobileSectionHeader
        title={categoriesTitle}
        titleClassName={categoriesTitleClassName}
        viewMoreLabel={viewMoreLabel}
      />
      <MobileCategoryCarousel categories={mappedCategories} frameImageSrc={mobileAssets.categoryFrame} />
    </div>
  );
}

type FigmaHomePageMobileProps = {
  lang: StorefrontLocale;
  categories: HomeCategoryItem[];
  featuredProducts: HomeFeaturedProduct[];
  dailyOfferProduct?: HomeFeaturedProduct | null;
};

export function FigmaHomePageMobile({
  lang,
  categories,
  featuredProducts,
  dailyOfferProduct,
}: FigmaHomePageMobileProps) {
  const t = (key: string) => translateKey(lang, key);
  const resolvedDailyOfferProduct = resolveHomeDailyOfferProduct(
    featuredProducts,
    dailyOfferProduct
  );
  const { newArrivalProducts, categoryProductsA, categoryProductsB } =
    sliceMobileHomeProductSections(featuredProducts);
  const displayCategories = buildMobileDisplayCategories(categories);
  const categoriesTitleClassName = lang === 'hy' ? montserratArmFont.className : undefined;
  const viewMoreLabel = t('common.buttons.viewMore');

  return (
    <div className="relative min-h-screen w-full overflow-x-clip overflow-y-visible bg-[var(--project-color)] lg:hidden">
      <div className="absolute -left-[210px] -top-[123px] h-[434px] w-[418px] rounded-full border-[80px] border-[#3E573D]" />
      <div className="absolute -right-[160px] -top-[184px] h-[320px] w-[360px] rounded-full border-[70px] border-[#3E573D]" />

      <header
        className={`relative overflow-visible ${MOBILE_FIGMA_HEADER_STACKING_CLASS} ${MOBILE_FIGMA_HEADER_HORIZONTAL_INSET_CLASS} pt-[58px]`}
      >
        <div
          className={`relative overflow-visible ${MOBILE_FIGMA_HEADER_TOP_ROW_STACKING_CLASS} flex translate-y-[20px] items-start justify-between`}
        >
          <Link href="/" prefetch className="inline-flex shrink-0" aria-label={t('common.navigation.home')}>
            <HomeOptimizedImage
              src={mobileAssets.logo}
              alt="Degusto"
              width={129}
              height={46}
              className="h-[46px] w-[129px] object-contain"
              priority
              loading="eager"
            />
          </Link>
          <div className="flex items-center gap-1">
            <button type="button" className="relative inline-flex h-12 w-12 items-center justify-center">
              <HomeOptimizedImage
                src={mobileAssets.callCircle}
                alt=""
                width={48}
                height={48}
                className="absolute inset-0 h-12 w-12 object-contain"
                loading="lazy"
              />
              <HomeOptimizedImage
                src={mobileAssets.callIcon}
                alt="Call"
                width={23}
                height={23}
                className="relative h-[23px] w-[23px] object-contain"
                loading="lazy"
              />
            </button>
            <MobileHomeHeaderActions switcherIconSrc={mobileAssets.switcherIcon} />
          </div>
        </div>

        <MobileHomeHeaderSearch
          searchIconSrc={mobileAssets.searchIcon}
          filterButtonSrc={mobileAssets.searchFilterButton}
          filterAriaLabel={t('products.header.filters')}
          searchPlaceholder={t('common.buttons.search')}
          headerSearchStackingClass={MOBILE_FIGMA_HEADER_SEARCH_STACKING_CLASS}
        />
      </header>

      <div className="relative z-10 mt-[87px] rounded-t-[30px] bg-white px-0 pb-[110px] pt-8">
        {displayCategories.length > 0 ? (
          <MobileCategoryStrip
            categories={displayCategories}
            categoriesTitle={t('common.navigation.categories')}
            categoriesTitleClassName={categoriesTitleClassName}
            viewMoreLabel={viewMoreLabel}
            translate={t}
          />
        ) : null}
        {resolvedDailyOfferProduct ? (
          <div className="mt-[22px]">
            <MobileDailyOfferCarousel
              products={[
                resolvedDailyOfferProduct,
                ...featuredProducts.filter((product) => product.id !== resolvedDailyOfferProduct.id),
              ]}
              dailyOfferAddToCartSrc={mobileAssets.dailyOfferAddToCart}
            />
          </div>
        ) : null}

        {newArrivalProducts.length > 0 ? (
          <div className={'mt-[30px] space-y-[22px] ' + MOBILE_HOME_PRODUCT_SECTION_HORIZONTAL_INSET_CLASS}>
            <MobileSectionHeader
              title={t('products.categoryNavigation.newArrivals')}
              viewMoreLabel={viewMoreLabel}
            />
            <MobileHomeProductGrid products={newArrivalProducts} />
          </div>
        ) : null}

        {categoryProductsA.length > 0 ? (
          <div className={'mt-[30px] space-y-[22px] ' + MOBILE_HOME_PRODUCT_SECTION_HORIZONTAL_INSET_CLASS}>
            <MobileSectionHeader
              title={t('common.navigation.categories')}
              titleClassName={categoriesTitleClassName}
              viewMoreLabel={viewMoreLabel}
            />
            <MobileHomeProductGrid products={categoryProductsA} />
          </div>
        ) : null}

        {categoryProductsB.length > 0 ? (
          <div className={'mt-[30px] space-y-[22px] ' + MOBILE_HOME_PRODUCT_SECTION_HORIZONTAL_INSET_CLASS}>
            <MobileSectionHeader
              title={t('common.navigation.categories')}
              titleClassName={categoriesTitleClassName}
              viewMoreLabel={viewMoreLabel}
            />
            <MobileHomeProductGrid products={categoryProductsB} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
