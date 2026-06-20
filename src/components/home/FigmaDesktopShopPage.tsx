'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../../lib/i18n-client';
import type { MenuCard, MenuCategory } from './menu-types';
import { StoreMenuPagination } from './StoreMenuPagination';
import {
  MOBILE_STOREFRONT_FILTERS_ANCHOR_ID,
} from '@/constants/mobile-figma-storefront';
import { useShopCategorySoftNav } from './useShopCategorySoftNav';
import { useShopMenuIdleCategoryPrefetch } from './useShopMenuIdleCategoryPrefetch';
import { useIsMobileViewport } from '@/hooks/useIsMobileViewport';
import { SHOP_ABOVE_FOLD_DESKTOP_IMAGE_COUNT } from '@/constants/shop-menu-perf';
import {
  STOREFRONT_DESKTOP_MAIN_COLUMN_CLASS,
  STOREFRONT_DESKTOP_PRODUCT_GRID_CLASS,
  STOREFRONT_DESKTOP_SHOP_SECTION_CLASS,
  STOREFRONT_DESKTOP_SIDEBAR_GAP_CLASS,
} from '@/constants/storefront-desktop-layout';
import { useRoutePrefetch } from './useRoutePrefetch';
import { FigmaDesktopShopCategorySidebar } from './shop-menu/FigmaDesktopShopCategorySidebar';
import { FigmaDesktopShopMenuCardItem } from './shop-menu/FigmaDesktopShopMenuCardItem';
import { FigmaDesktopShopMobileSection } from './shop-menu/FigmaDesktopShopMobileSection';
import { ShopFoodAttributeSwitcher } from './shop-menu/ShopFoodAttributeSwitcher';
import { ShopMenuProductGridShell } from './shop-menu/ShopMenuProductGridShell';
import { useBuildMenuTargetPath, useMenuSearchUrlSync } from './shop-menu/useShopMenuUrlSync';

type DesktopMenuPageProps = {
  titleKey: string;
  subtitleKey: string;
  activeCategoryIndex: number;
  cards?: MenuCard[];
  categories?: MenuCategory[];
  activeCategorySlug?: string;
  initialSearch?: string;
  initialMinPrice?: string;
  initialMaxPrice?: string;
  initialFoodFilter?: 'leaf' | 'neutral' | 'pepper';
  menuPagination?: {
    currentPage: number;
    totalPages: number;
  };
  /** When false, hides the mobile product list (e.g. mobile shop category grid on `/shop`). */
  showMobileProductsList?: boolean;
  /** When false, skips desktop section render (used on mobile to reduce hydration/DOM cost). */
  renderDesktopLayout?: boolean;
  /** When categories are omitted server-side (mobile product list), still show the picker button. */
  showCategoryPicker?: boolean;
};

export function FigmaDesktopMenuPage({
  titleKey,
  subtitleKey,
  activeCategoryIndex: _activeCategoryIndex,
  cards,
  categories: dbCategories,
  activeCategorySlug = '',
  initialSearch = '',
  initialMinPrice = '',
  initialMaxPrice = '',
  initialFoodFilter = 'neutral',
  menuPagination,
  showMobileProductsList = true,
  renderDesktopLayout = true,
  showCategoryPicker,
}: DesktopMenuPageProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const menuCards = cards ?? [];
  const hasDbCategories =
    showCategoryPicker ?? (Array.isArray(dbCategories) && dbCategories.length > 0);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [foodFilter, setFoodFilter] = useState<'leaf' | 'neutral' | 'pepper'>(initialFoodFilter);
  const routeBasePath = pathname?.startsWith('/combo') ? '/combo' : '/shop';
  const enableSoftCategoryNav = routeBasePath === '/shop' || routeBasePath === '/combo';
  const isMobileViewport = useIsMobileViewport();
  const shouldRenderDesktopLayout = renderDesktopLayout && !isMobileViewport;

  useEffect(() => {
    setSearchTerm(initialSearch);
    setMinPrice(initialMinPrice);
    setMaxPrice(initialMaxPrice);
    setFoodFilter(initialFoodFilter);
  }, [initialFoodFilter, initialMaxPrice, initialMinPrice, initialSearch]);

  const {
    displayCards: desktopDisplayCards,
    displayActiveCategorySlug,
    displayPagination: desktopDisplayPagination,
    isProductsPending,
    previewTasteFilterForHref,
    navigateCategory,
    syncProductsFromHref,
    prefetchCategory,
  } = useShopCategorySoftNav({
    initialCards: menuCards,
    initialActiveCategorySlug: activeCategorySlug,
    initialPagination: menuPagination,
    enabled: enableSoftCategoryNav,
  });

  const resolvedMenuCards = enableSoftCategoryNav ? desktopDisplayCards : menuCards;
  const resolvedActiveCategorySlug = enableSoftCategoryNav
    ? displayActiveCategorySlug
    : activeCategorySlug;
  const resolvedMenuPagination = enableSoftCategoryNav ? desktopDisplayPagination : menuPagination;
  const productsPending = enableSoftCategoryNav && isProductsPending;
  const productsLoadingLabel = t('common.messages.loading');

  useEffect(() => {
    if (!showMobileProductsList || searchParams.get('openFilters') !== '1') {
      return;
    }
    document.getElementById(MOBILE_STOREFRONT_FILTERS_ANCHOR_ID)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, [searchParams, showMobileProductsList]);

  const buildTargetPath = useBuildMenuTargetPath(
    searchParams,
    searchTerm,
    minPrice,
    maxPrice,
    foodFilter,
    routeBasePath,
    enableSoftCategoryNav
  );

  const commitShopUrlChange = useCallback(
    (href: string) => {
      if (enableSoftCategoryNav) {
        syncProductsFromHref(href);
        return;
      }
      router.replace(href);
    },
    [enableSoftCategoryNav, router, syncProductsFromHref]
  );

  const { scheduleSearchQueryUrlSync, flushSearchQueryUrlSync, schedulePriceFilterUrlSync } =
    useMenuSearchUrlSync(
      commitShopUrlChange,
      buildTargetPath,
      resolvedActiveCategorySlug,
      minPrice,
      maxPrice,
      foodFilter
    );

  const handleFoodFilterChange = useCallback(
    (nextTaste: 'leaf' | 'neutral' | 'pepper') => {
      setFoodFilter(nextTaste);
      const href = buildTargetPath(resolvedActiveCategorySlug, {
        search: searchTerm,
        minPrice,
        maxPrice,
        taste: nextTaste,
        page: 1,
      });
      previewTasteFilterForHref(href);
      commitShopUrlChange(href);
    },
    [
      buildTargetPath,
      commitShopUrlChange,
      maxPrice,
      minPrice,
      previewTasteFilterForHref,
      resolvedActiveCategorySlug,
      searchTerm,
    ]
  );

  const handleSoftPaginationNavigate = useCallback(
    (href: string) => {
      if (!enableSoftCategoryNav) {
        return;
      }
      syncProductsFromHref(href);
    },
    [enableSoftCategoryNav, syncProductsFromHref]
  );

  const categoryNavItems = useMemo(() => {
    if (!Array.isArray(dbCategories)) {
      return [];
    }
    return dbCategories.map((category) => ({
      category,
      // Category switches should always start from page 1 to avoid clamped page re-queries.
      href: buildTargetPath(category.slug, { page: 1 }),
    }));
  }, [buildTargetPath, dbCategories]);

  const categoryNavHrefs = useMemo(() => categoryNavItems.map((item) => item.href), [categoryNavItems]);

  useShopMenuIdleCategoryPrefetch({
    categoryHrefs: categoryNavHrefs,
    activeCategorySlug: resolvedActiveCategorySlug,
    enabled: enableSoftCategoryNav,
  });

  const { getPrefetchHandlers } = useRoutePrefetch(
    enableSoftCategoryNav ? [] : categoryNavHrefs
  );

  const openMobileCategoryPicker = useCallback(() => {
    router.push(routeBasePath);
  }, [router, routeBasePath]);

  const handleMinPriceChange = useCallback(
    (nextMinPrice: string) => {
      setMinPrice(nextMinPrice);
      schedulePriceFilterUrlSync({ minPrice: nextMinPrice });
    },
    [schedulePriceFilterUrlSync]
  );

  const handleMaxPriceChange = useCallback(
    (nextMaxPrice: string) => {
      setMaxPrice(nextMaxPrice);
      schedulePriceFilterUrlSync({ maxPrice: nextMaxPrice });
    },
    [schedulePriceFilterUrlSync]
  );

  return (
    <>
      {showMobileProductsList ? (
        <FigmaDesktopShopMobileSection
          titleKey={titleKey}
          subtitleKey={subtitleKey}
          hasDbCategories={hasDbCategories}
          onOpenCategoryPicker={openMobileCategoryPicker}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onMinPriceChange={handleMinPriceChange}
          onMaxPriceChange={handleMaxPriceChange}
          foodFilter={foodFilter}
          onFoodFilterChange={handleFoodFilterChange}
          productsPending={productsPending}
          resolvedMenuCards={resolvedMenuCards}
          resolvedMenuPagination={resolvedMenuPagination}
          buildTargetPath={buildTargetPath}
          resolvedActiveCategorySlug={resolvedActiveCategorySlug}
          enableSoftCategoryNav={enableSoftCategoryNav}
          onSoftPaginationNavigate={handleSoftPaginationNavigate}
        />
      ) : null}

      {shouldRenderDesktopLayout ? (
        <div className="bg-white pb-20 pt-5">
          <div className={`${STOREFRONT_DESKTOP_SHOP_SECTION_CLASS} flex min-w-0 ${STOREFRONT_DESKTOP_SIDEBAR_GAP_CLASS}`}>
            <FigmaDesktopShopCategorySidebar
              searchTerm={searchTerm}
              onSearchTermChange={(nextSearch) => {
                setSearchTerm(nextSearch);
                scheduleSearchQueryUrlSync(nextSearch);
              }}
              onSearchSubmit={() => flushSearchQueryUrlSync(searchTerm)}
              categoryNavItems={categoryNavItems}
              resolvedActiveCategorySlug={resolvedActiveCategorySlug}
              enableSoftCategoryNav={enableSoftCategoryNav}
              onNavigateCategory={navigateCategory}
              onPrefetchCategory={prefetchCategory}
              getPrefetchHandlers={getPrefetchHandlers}
            />

            <section className={STOREFRONT_DESKTOP_MAIN_COLUMN_CLASS}>
              <div className="mb-[42px] mt-10 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 pt-1">
                  <h1 className="text-4xl font-bold leading-tight text-[#f66913] xl:text-[60px] xl:leading-[51px]">{t(titleKey)}</h1>
                  <p className="mt-2.5 text-base tracking-[-0.31px] text-[#717182]">
                    {t(subtitleKey)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-[#717182] xl:pt-[37px]">
                  <span className="w-full shrink-0 px-1 text-base xl:w-auto">{t('home.figma.desktop.shop.priceLabel')}</span>
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={minPrice}
                    onChange={(event) => handleMinPriceChange(event.target.value)}
                    placeholder={t('home.figma.desktop.shop.priceFrom')}
                    className="h-[46px] w-[109px] rounded-[40px] bg-[#f3f3f5] px-4 text-left text-base text-[#7f7f80]"
                  />
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={maxPrice}
                    onChange={(event) => handleMaxPriceChange(event.target.value)}
                    placeholder={t('home.figma.desktop.shop.priceTo')}
                    className="h-[46px] w-[109px] rounded-[40px] bg-[#f3f3f5] px-4 text-left text-base text-[#7f7f80]"
                  />
                  <ShopFoodAttributeSwitcher
                    selectedOption={foodFilter}
                    onChange={handleFoodFilterChange}
                  />
                </div>
              </div>

              <ShopMenuProductGridShell
                isPending={productsPending}
                loadingLabel={productsLoadingLabel}
                gridClassName={STOREFRONT_DESKTOP_PRODUCT_GRID_CLASS}
                hasProducts={resolvedMenuCards.length > 0}
                skeletonVariant="desktop"
                emptyState={
                  <div className="flex min-h-[280px] items-center justify-center rounded-[20px] border border-dashed border-[#d4d4d8] bg-[#fafafc] px-6 text-center text-[18px] font-medium text-[#717182]">
                    {t('common.messages.noProductsFound')}
                  </div>
                }
              >
                {resolvedMenuCards.map((card, index) => (
                  <FigmaDesktopShopMenuCardItem
                    key={card.id}
                    card={card}
                    imagePriority={index < SHOP_ABOVE_FOLD_DESKTOP_IMAGE_COUNT}
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
                  onSoftNavigate={enableSoftCategoryNav ? handleSoftPaginationNavigate : undefined}
                />
              ) : null}
            </section>
          </div>
        </div>
      ) : null}
    </>
  );
}

export type { MenuCard, MenuCategory } from './menu-types';
