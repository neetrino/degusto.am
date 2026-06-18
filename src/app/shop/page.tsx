import { Suspense } from 'react';
import { MobileShopCategoriesView } from '@/components/home/MobileShopCategoriesView';
import { StorefrontMenuPageLoading } from '@/components/home/StorefrontMenuPageLoading';
import { BodyBackground } from '@/components/BodyBackground';
import { shouldShowMobileShopCategoryGrid } from '@/lib/shop-mobile-view';
import { normalizeStorefrontCategorySlug } from '@/constants/storefront-all-category-slug';
import { cookies } from 'next/headers';
import { resolveStorefrontLocaleFromCookie } from '@/lib/i18n/locale';
import { getShopMenuSidebarPayload } from '@/lib/services/shop-page/shop-page-data.service';
import { ShopMenuPageLoader } from './ShopMenuPageLoader';

type SearchParamsInput = Record<string, string | string[] | undefined>;

async function ShopMobileCategoriesLoader({
  locale,
  selectedSearchQuery,
  tasteFilter,
  minPriceAmd,
  maxPriceAmd,
}: {
  locale: ReturnType<typeof resolveStorefrontLocaleFromCookie>;
  selectedSearchQuery: string;
  tasteFilter: 'leaf' | 'pepper' | null;
  minPriceAmd: number | null;
  maxPriceAmd: number | null;
}) {
  const { mobileShopCategories } = await getShopMenuSidebarPayload({
    locale,
    selectedSearchQuery,
    tasteFilter,
    minPriceAmd,
    maxPriceAmd,
  });

  return <MobileShopCategoriesView categories={mobileShopCategories} />;
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParamsInput>;
}) {
  const [params, cookieStore] = await Promise.all([searchParams, cookies()]);
  const resolvedParams = params ?? {};
  const locale = resolveStorefrontLocaleFromCookie(cookieStore.get('shop_language')?.value);
  const rawCategorySlug =
    typeof resolvedParams?.category === 'string' ? resolvedParams.category.trim() : '';
  const selectedCategorySlug = normalizeStorefrontCategorySlug(rawCategorySlug);
  const selectedSearchQuery =
    typeof resolvedParams?.search === 'string' ? resolvedParams.search.trim() : '';
  const tasteParam =
    typeof resolvedParams?.taste === 'string' ? resolvedParams.taste : null;
  const tasteFilter: 'leaf' | 'pepper' | null =
    tasteParam === 'leaf' || tasteParam === 'pepper' ? tasteParam : null;
  const openFilters = resolvedParams?.openFilters === '1';
  const minPriceParam =
    typeof resolvedParams?.minPrice === 'string' ? Number(resolvedParams.minPrice) : null;
  const maxPriceParam =
    typeof resolvedParams?.maxPrice === 'string' ? Number(resolvedParams.maxPrice) : null;
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
  const rawPage = typeof resolvedParams?.page === 'string' ? resolvedParams.page.trim() : '';
  const parsedPage = parseInt(rawPage || '1', 10);
  const requestedPage =
    Number.isFinite(parsedPage) && parsedPage >= 1 ? parsedPage : 1;

  const menuQuery = {
    locale,
    selectedCategorySlug,
    selectedSearchQuery,
    tasteFilter,
    minPriceAmd,
    maxPriceAmd,
    requestedPage,
    loadProfile: 'full' as const,
  };

  return (
    <div className="min-h-screen bg-white">
      <BodyBackground color="#ffffff" />
      {showMobileCategoryGrid ? (
        <Suspense
          fallback={
            <div className="space-y-4 px-4 pb-4 pt-6 lg:hidden" aria-busy="true" aria-hidden>
              <div className="h-5 w-32 animate-pulse rounded-full bg-[#f3f3f5]" />
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="h-[140px] animate-pulse rounded-[20px] bg-[#f3f3f5]" />
                ))}
              </div>
            </div>
          }
        >
          <ShopMobileCategoriesLoader
            locale={locale}
            selectedSearchQuery={selectedSearchQuery}
            tasteFilter={tasteFilter}
            minPriceAmd={minPriceAmd}
            maxPriceAmd={maxPriceAmd}
          />
        </Suspense>
      ) : null}
      <Suspense fallback={<StorefrontMenuPageLoading />}>
        <ShopMenuPageLoader
          menuQuery={menuQuery}
          titleKey="home.figma.desktop.shop.menuTitle"
          subtitleKey="home.figma.desktop.shop.menuSubtitle"
          rawCategorySlug={rawCategorySlug}
          selectedSearchQuery={selectedSearchQuery}
          minPriceAmd={minPriceAmd}
          maxPriceAmd={maxPriceAmd}
          tasteFilter={tasteFilter}
          showMobileProductsList={!showMobileCategoryGrid}
        />
      </Suspense>
    </div>
  );
}
