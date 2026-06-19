import { useTranslation } from '../../../lib/i18n-client';
import { MobileFriendlyInput } from '@/components/mobile/MobileFriendlyInput';
import {
  MOBILE_SHOP_PRODUCTS_GRID_CLASS,
  MOBILE_STOREFRONT_FILTERS_ANCHOR_ID,
  MOBILE_STOREFRONT_PAGE_SECTION_CLASS,
} from '@/constants/mobile-figma-storefront';
import { SHOP_ABOVE_FOLD_MOBILE_IMAGE_COUNT } from '@/constants/shop-menu-perf';
import type { MenuCard } from '../menu-types';
import { ShopMobileProductCard } from '../ShopMobileProductCard';
import { StoreMenuPagination } from '../StoreMenuPagination';
import { ShopFoodAttributeSwitcher } from './ShopFoodAttributeSwitcher';
import { ShopMenuProductGridShell } from './ShopMenuProductGridShell';
import type { BuildMenuTargetPathFn } from './useShopMenuUrlSync';

type FoodFilterOption = 'leaf' | 'neutral' | 'pepper';

type FigmaDesktopShopMobileSectionProps = {
  titleKey: string;
  subtitleKey: string;
  hasDbCategories: boolean;
  onOpenCategoryPicker: () => void;
  minPrice: string;
  maxPrice: string;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  foodFilter: FoodFilterOption;
  onFoodFilterChange: (next: FoodFilterOption) => void;
  productsPending: boolean;
  resolvedMenuCards: MenuCard[];
  resolvedMenuPagination?: {
    currentPage: number;
    totalPages: number;
  };
  buildTargetPath: BuildMenuTargetPathFn;
  resolvedActiveCategorySlug: string;
  enableSoftCategoryNav: boolean;
  onSoftPaginationNavigate?: (href: string) => void;
};

export function FigmaDesktopShopMobileSection({
  titleKey,
  subtitleKey,
  hasDbCategories,
  onOpenCategoryPicker,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  foodFilter,
  onFoodFilterChange,
  productsPending,
  resolvedMenuCards,
  resolvedMenuPagination,
  buildTargetPath,
  resolvedActiveCategorySlug,
  enableSoftCategoryNav,
  onSoftPaginationNavigate,
}: FigmaDesktopShopMobileSectionProps) {
  const { t } = useTranslation();
  const productsLoadingLabel = t('common.messages.loading');

  return (
    <div className="pb-8 pt-0 lg:hidden">
      <div className={MOBILE_STOREFRONT_PAGE_SECTION_CLASS}>
        <h1 className="text-[32px] font-bold leading-tight text-[#f66913]">{t(titleKey)}</h1>
        <p className="mt-2 text-sm tracking-[-0.2px] text-[#717182]">{t(subtitleKey)}</p>

        {hasDbCategories ? (
          <button
            type="button"
            onClick={onOpenCategoryPicker}
            className="mt-4 flex h-[46px] w-full items-center justify-center rounded-[40px] bg-[#ff7f20] px-4 text-base font-semibold text-white"
          >
            {t('home.figma.mobile.chooseCategories')}
          </button>
        ) : null}

        <div
          id={MOBILE_STOREFRONT_FILTERS_ANCHOR_ID}
          className="scroll-mt-28 mt-6 flex flex-wrap items-center gap-2 text-sm text-[#717182]"
        >
          <span className="w-full shrink-0 text-base sm:w-auto">{t('home.figma.desktop.shop.priceLabel')}</span>
          <MobileFriendlyInput
            type="number"
            min={0}
            inputMode="numeric"
            value={minPrice}
            onChange={(event) => onMinPriceChange(event.target.value)}
            placeholder={t('home.figma.desktop.shop.priceFrom')}
            className="h-[46px] min-w-0 flex-1 rounded-[40px] bg-[#f3f3f5] px-4 text-left text-base text-[#7f7f80] sm:flex-none sm:basis-[109px]"
          />
          <MobileFriendlyInput
            type="number"
            min={0}
            inputMode="numeric"
            value={maxPrice}
            onChange={(event) => onMaxPriceChange(event.target.value)}
            placeholder={t('home.figma.desktop.shop.priceTo')}
            className="h-[46px] min-w-0 flex-1 rounded-[40px] bg-[#f3f3f5] px-4 text-left text-base text-[#7f7f80] sm:flex-none sm:basis-[109px]"
          />
          <ShopFoodAttributeSwitcher selectedOption={foodFilter} onChange={onFoodFilterChange} />
        </div>

        <ShopMenuProductGridShell
          isPending={productsPending}
          loadingLabel={productsLoadingLabel}
          gridClassName={`mt-8 ${MOBILE_SHOP_PRODUCTS_GRID_CLASS}`}
          hasProducts={resolvedMenuCards.length > 0}
          skeletonVariant="mobile"
          emptyState={
            <div className="mt-8 flex min-h-[200px] items-center justify-center rounded-[20px] border border-dashed border-[#d4d4d8] bg-[#fafafc] px-6 text-center text-base font-medium text-[#717182]">
              {t('common.messages.noProductsFound')}
            </div>
          }
        >
          {resolvedMenuCards.map((card, index) => (
            <ShopMobileProductCard
              key={card.id}
              card={card}
              imagePriority={index < SHOP_ABOVE_FOLD_MOBILE_IMAGE_COUNT}
            />
          ))}
        </ShopMenuProductGridShell>

        {resolvedMenuPagination ? (
          <StoreMenuPagination
            navAriaLabel={t('common.ariaLabels.paginationNav')}
            currentPage={resolvedMenuPagination.currentPage}
            totalPages={resolvedMenuPagination.totalPages}
            buildPageHref={(targetPage) =>
              buildTargetPath(resolvedActiveCategorySlug, { page: targetPage })
            }
            onSoftNavigate={enableSoftCategoryNav ? onSoftPaginationNavigate : undefined}
          />
        ) : null}
      </div>
    </div>
  );
}
