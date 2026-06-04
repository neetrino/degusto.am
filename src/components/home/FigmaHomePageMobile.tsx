import Link from 'next/link';
import { ViewMoreButton } from '../view-more/ViewMoreButton';
import { StorefrontCategoryLink } from '../routing/StorefrontCategoryLink';
import { t as translateKey } from '@/lib/i18n';
import type { StorefrontLocale } from '@/lib/i18n/locale';
import { mirageExpandedFont } from '@/fonts/mirage-expanded-font';
import { getHomeCategoryHref } from './homeCategoryLinks';
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
import { MobileHomeDailyOffer } from './MobileHomeDailyOffer';
import { MobileHomeProductGrid } from './MobileHomeProductGrid';

const mobileAssets = {
  ...MOBILE_FIGMA_STOREFRONT_ASSETS,
  categoryFrame: r2Asset('category/20260512-uqGTJqCe88.svg'),
  dailyOfferAddToCart: r2Asset('assets/20260512-AiLSWk8lFo.svg'),
};

const MOBILE_HOME_PRODUCT_SECTION_HORIZONTAL_INSET_CLASS = 'px-3';

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
  return (
    <div className={'space-y-3 ' + MOBILE_HOME_PRODUCT_SECTION_HORIZONTAL_INSET_CLASS}>
      <MobileSectionHeader
        title={categoriesTitle}
        titleClassName={categoriesTitleClassName}
        viewMoreLabel={viewMoreLabel}
      />
      <div className="grid grid-cols-5 gap-2 pb-1">
        {categories.map((category) => {
          const title = category.title ?? translate(category.titleKey);

          return (
            <StorefrontCategoryLink
              key={category.id}
              href={getHomeCategoryHref({ slug: category.slug, title })}
              className="min-w-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f66a13]"
              aria-label={title}
            >
              <div className="relative mx-auto flex h-[72px] w-[48px] items-center justify-center rounded-[24px] bg-[#090909]">
                {category.framed ? (
                  <HomeOptimizedImage
                    src={mobileAssets.categoryFrame}
                    alt=""
                    width={48}
                    height={72}
                    className="absolute inset-0 h-full w-full object-contain"
                    loading="lazy"
                  />
                ) : null}
                <HomeOptimizedImage
                  src={category.image}
                  alt={title}
                  width={40}
                  height={42}
                  className="relative h-[42px] w-[40px] rounded-[10px] object-cover"
                  loading="lazy"
                  sizes="48px"
                />
              </div>
              <p className="mt-[6px] text-center text-xs leading-5 text-black">{title}</p>
            </StorefrontCategoryLink>
          );
        })}
      </div>
      <div className="pt-1">
        <MobileSliderIndicator />
      </div>
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
  const categoriesTitleClassName = lang === 'hy' ? mirageExpandedFont.className : undefined;
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

      <main className="relative z-10 mt-[87px] rounded-t-[30px] bg-white px-0 pb-[110px] pt-8">
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
          <div className={'mt-[22px] ' + MOBILE_HOME_PRODUCT_SECTION_HORIZONTAL_INSET_CLASS}>
            <MobileHomeDailyOffer
              product={resolvedDailyOfferProduct}
              dailyOfferAddToCartSrc={mobileAssets.dailyOfferAddToCart}
            />
          </div>
        ) : null}
        <div className={'mt-[19px] ' + MOBILE_HOME_PRODUCT_SECTION_HORIZONTAL_INSET_CLASS}>
          <MobileCategorySliderIndicator />
        </div>

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
      </main>
    </div>
  );
}
