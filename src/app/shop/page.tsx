import { Suspense } from 'react';
import { FigmaDesktopMenuPage } from '../../components/home/FigmaDesktopShopPage';
import { MobileShopCategoriesView } from '../../components/home/MobileShopCategoriesView';
import { BodyBackground } from '../../components/BodyBackground';
import { StorefrontLocaleUrlSync } from '@/components/routing/StorefrontLocaleUrlSync';
import { shouldShowMobileShopCategoryGrid } from '@/lib/shop-mobile-view';
import { normalizeStorefrontCategorySlug } from '@/constants/storefront-all-category-slug';
import { resolveStorefrontLocaleFromPageSearchParams } from '@/lib/i18n/locale';
import { getShopMenuData } from '@/lib/services/shop-page/shop-page-data.service';
import type { ShopMenuQuery } from '@/lib/services/shop-page/shop-page-query.types';

type SearchParamsInput = Record<string, string | string[] | undefined>;

/** Keep in sync with `STOREFRONT_ISR_REVALIDATE_SECONDS` in `@/constants/storefront-isr`. */
export const revalidate = 86_400;

function parseShopPageQuery(params: SearchParamsInput): Omit<ShopMenuQuery, 'loadProfile'> {
  const locale = resolveStorefrontLocaleFromPageSearchParams(params);
  const rawCategorySlug =
    typeof params?.category === 'string' ? params.category.trim() : '';
  const selectedCategorySlug = normalizeStorefrontCategorySlug(rawCategorySlug);
  const selectedSearchQuery =
    typeof params?.search === 'string' ? params.search.trim() : '';
  const tasteFilter =
    params?.taste === 'leaf' || params?.taste === 'pepper' ? params.taste : null;
  const minPriceParam =
    typeof params?.minPrice === 'string' ? Number(params.minPrice) : null;
  const maxPriceParam =
    typeof params?.maxPrice === 'string' ? Number(params.maxPrice) : null;
  const rawPage = typeof params?.page === 'string' ? params.page.trim() : '';
  const parsedPage = parseInt(rawPage || '1', 10);

  return {
    locale,
    selectedCategorySlug,
    selectedSearchQuery,
    tasteFilter,
    minPriceAmd:
      typeof minPriceParam === 'number' && Number.isFinite(minPriceParam) && minPriceParam >= 0
        ? minPriceParam
        : null,
    maxPriceAmd:
      typeof maxPriceParam === 'number' && Number.isFinite(maxPriceParam) && maxPriceParam >= 0
        ? maxPriceParam
        : null,
    requestedPage: Number.isFinite(parsedPage) && parsedPage >= 1 ? parsedPage : 1,
  };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParamsInput>;
}) {
  const params = (await searchParams) ?? {};
  const query = parseShopPageQuery(params);
  const rawCategorySlug =
    typeof params?.category === 'string' ? params.category.trim() : '';
  const showMobileCategoryGrid = shouldShowMobileShopCategoryGrid({
    categorySlug: rawCategorySlug,
    searchQuery: query.selectedSearchQuery,
    tasteFilter: query.tasteFilter,
    minPriceAmd: query.minPriceAmd,
    maxPriceAmd: query.maxPriceAmd,
    openFilters: params?.openFilters === '1',
  });

  const menuData = showMobileCategoryGrid
    ? await (async () => {
        const [mobileGrid, full] = await Promise.all([
          getShopMenuData({ ...query, loadProfile: 'mobile-grid' }),
          getShopMenuData({ ...query, loadProfile: 'full' }),
        ]);
        return {
          cards: full.cards,
          categories: full.categories,
          mobileShopCategories: mobileGrid.mobileShopCategories,
          showCategoryPicker: full.showCategoryPicker,
          effectivePage: full.effectivePage,
          totalPages: full.totalPages,
        };
      })()
    : await getShopMenuData({ ...query, loadProfile: 'full' });

  const {
    cards,
    categories,
    mobileShopCategories,
    showCategoryPicker,
    effectivePage,
    totalPages,
  } = menuData;

  return (
    <div className="min-h-screen bg-white">
      <BodyBackground color="#ffffff" />
      <Suspense fallback={null}>
        <StorefrontLocaleUrlSync />
      </Suspense>
      {showMobileCategoryGrid ? (
        <MobileShopCategoriesView categories={mobileShopCategories} />
      ) : null}
      <Suspense fallback={<div className="min-h-[480px] animate-pulse bg-white" aria-hidden />}>
        <FigmaDesktopMenuPage
          titleKey="home.figma.desktop.shop.menuTitle"
          subtitleKey="home.figma.desktop.shop.menuSubtitle"
          activeCategoryIndex={0}
          cards={cards}
          categories={categories}
          activeCategorySlug={rawCategorySlug}
          initialSearch={query.selectedSearchQuery}
          initialMinPrice={query.minPriceAmd !== null ? String(query.minPriceAmd) : ''}
          initialMaxPrice={query.maxPriceAmd !== null ? String(query.maxPriceAmd) : ''}
          initialFoodFilter={query.tasteFilter ?? 'neutral'}
          menuPagination={{
            currentPage: effectivePage,
            totalPages,
          }}
          showMobileProductsList={!showMobileCategoryGrid}
          renderDesktopLayout
          showCategoryPicker={showCategoryPicker}
        />
      </Suspense>
    </div>
  );
}
