import { FigmaDesktopMenuPage } from '../../components/home/FigmaDesktopShopPage';
import { MobileShopCategoriesView } from '../../components/home/MobileShopCategoriesView';
import { BodyBackground } from '../../components/BodyBackground';
import { shouldShowMobileShopCategoryGrid } from '@/lib/shop-mobile-view';
import { normalizeStorefrontCategorySlug } from '@/constants/storefront-all-category-slug';
import { cookies, headers } from 'next/headers';
import { userAgent } from 'next/server';
import { resolveStorefrontLocaleFromCookie } from '@/lib/i18n/locale';
import { getShopMenuData } from '@/lib/services/shop-page/shop-page-data.service';

type SearchParamsInput = Record<string, string | string[] | undefined>;

export default async function ShopPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParamsInput> | SearchParamsInput;
}) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const cookieStore = await cookies();
  const locale = resolveStorefrontLocaleFromCookie(cookieStore.get('shop_language')?.value);
  const rawCategorySlug =
    typeof params?.category === 'string' ? params.category.trim() : '';
  const selectedCategorySlug = normalizeStorefrontCategorySlug(rawCategorySlug);
  const selectedSearchQuery =
    typeof params?.search === 'string' ? params.search.trim() : '';
  const tasteFilter =
    params?.taste === 'leaf' || params?.taste === 'pepper' ? params.taste : null;
  const openFilters = params?.openFilters === '1';
  const minPriceParam =
    typeof params?.minPrice === 'string' ? Number(params.minPrice) : null;
  const maxPriceParam =
    typeof params?.maxPrice === 'string' ? Number(params.maxPrice) : null;
  const minPriceAmd =
    typeof minPriceParam === 'number' && Number.isFinite(minPriceParam) && minPriceParam >= 0
      ? minPriceParam
      : null;
  const maxPriceAmd =
    typeof maxPriceParam === 'number' && Number.isFinite(maxPriceParam) && maxPriceParam >= 0
      ? maxPriceParam
      : null;
  const showMobileCategoryGrid = shouldShowMobileShopCategoryGrid({
    categorySlug: rawCategorySlug,
    searchQuery: selectedSearchQuery,
    tasteFilter,
    minPriceAmd,
    maxPriceAmd,
    openFilters,
  });
  const rawPage = typeof params?.page === 'string' ? params.page.trim() : '';
  const parsedPage = parseInt(rawPage || '1', 10);
  const requestedPage =
    Number.isFinite(parsedPage) && parsedPage >= 1 ? parsedPage : 1;
  const { device } = userAgent({ headers: await headers() });
  const isMobileClient = device.type === 'mobile';

  const { cards, categories, mobileShopCategories, effectivePage, totalPages } =
    await getShopMenuData({
      locale,
      selectedCategorySlug,
      selectedSearchQuery,
      tasteFilter,
      minPriceAmd,
      maxPriceAmd,
      requestedPage,
      mobileCategoryGridOnly: showMobileCategoryGrid && isMobileClient,
    });

  return (
    <div className="min-h-screen bg-white">
      <BodyBackground color="#ffffff" />
      {showMobileCategoryGrid ? (
        <MobileShopCategoriesView categories={mobileShopCategories} />
      ) : null}
      <FigmaDesktopMenuPage
        titleKey="home.figma.desktop.shop.menuTitle"
        subtitleKey="home.figma.desktop.shop.menuSubtitle"
        activeCategoryIndex={0}
        cards={cards}
        categories={categories}
        activeCategorySlug={rawCategorySlug}
        initialSearch={selectedSearchQuery}
        initialMinPrice={minPriceAmd !== null ? String(minPriceAmd) : ''}
        initialMaxPrice={maxPriceAmd !== null ? String(maxPriceAmd) : ''}
        initialFoodFilter={tasteFilter ?? 'neutral'}
        menuPagination={{
          currentPage: effectivePage,
          totalPages,
        }}
        showMobileProductsList={!showMobileCategoryGrid}
      />
    </div>
  );
}
