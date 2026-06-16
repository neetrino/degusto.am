import { Suspense } from 'react';
import { BodyBackground } from '../../components/BodyBackground';
import { FigmaDesktopComboPage } from '../../components/home/FigmaDesktopComboPage';
import { cookies, headers } from 'next/headers';
import { userAgent } from 'next/server';
import { resolveStorefrontLocaleFromCookie } from '@/lib/i18n/locale';
import { getComboMenuData } from '@/lib/services/combo-page/combo-page-data.service';

type SearchParamsInput = Record<string, string | string[] | undefined>;

export default async function ComboPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParamsInput>;
}) {
  const params = (await searchParams) ?? {};
  const [cookieStore, headersList] = await Promise.all([cookies(), headers()]);
  const locale = resolveStorefrontLocaleFromCookie(cookieStore.get('shop_language')?.value);
  const selectedCategorySlug =
    typeof params?.category === 'string' ? params.category.trim() : '';
  const selectedSearchQuery =
    typeof params?.search === 'string' ? params.search.trim() : '';
  const tasteFilter =
    params?.taste === 'leaf' || params?.taste === 'pepper' ? params.taste : null;
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
  const rawPage = typeof params?.page === 'string' ? params.page.trim() : '';
  const parsedPage = parseInt(rawPage || '1', 10);
  const requestedPage =
    Number.isFinite(parsedPage) && parsedPage >= 1 ? parsedPage : 1;
  const { device } = userAgent({ headers: headersList });
  const isMobileClient = device.type === 'mobile';
  const loadProfile = isMobileClient ? 'products-only' : 'full';

  const { cards, categories, effectivePage, totalPages } = await getComboMenuData({
    locale,
    selectedCategorySlug,
    selectedSearchQuery,
    tasteFilter,
    minPriceAmd,
    maxPriceAmd,
    requestedPage,
    loadProfile,
  });

  return (
    <div className="min-h-screen bg-white">
      <BodyBackground color="#ffffff" />
      <Suspense fallback={<div className="min-h-[480px] animate-pulse bg-white" aria-hidden />}>
        <FigmaDesktopComboPage
          cards={cards}
          categories={categories}
          activeCategorySlug={selectedCategorySlug}
          initialSearch={selectedSearchQuery}
          initialMinPrice={minPriceAmd !== null ? String(minPriceAmd) : ''}
          initialMaxPrice={maxPriceAmd !== null ? String(maxPriceAmd) : ''}
          initialFoodFilter={tasteFilter ?? 'neutral'}
          menuPagination={{
            currentPage: effectivePage,
            totalPages,
          }}
          showMobileProductsList
          renderDesktopLayout={!isMobileClient}
        />
      </Suspense>
    </div>
  );
}
