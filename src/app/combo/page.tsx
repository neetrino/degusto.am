import { Suspense } from 'react';
import { BodyBackground } from '../../components/BodyBackground';
import { StorefrontMenuPageLoading } from '@/components/home/StorefrontMenuPageLoading';
import { normalizeStorefrontCategorySlug } from '@/constants/storefront-all-category-slug';
import { cookies, headers } from 'next/headers';
import { resolveStorefrontLocaleFromCookie } from '@/lib/i18n/locale';
import { ComboMenuPageLoader } from './ComboMenuPageLoader';
import { isMobileUserAgent } from '@/lib/viewport';

type SearchParamsInput = Record<string, string | string[] | undefined>;

export default async function ComboPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParamsInput>;
}) {
  const [params, cookieStore, headersList] = await Promise.all([searchParams, cookies(), headers()]);
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
  const rawPage = typeof resolvedParams?.page === 'string' ? resolvedParams.page.trim() : '';
  const parsedPage = parseInt(rawPage || '1', 10);
  const requestedPage =
    Number.isFinite(parsedPage) && parsedPage >= 1 ? parsedPage : 1;
  const userAgent = headersList.get('user-agent');
  const clientHintMobile = headersList.get('sec-ch-ua-mobile') === '?1';
  const renderDesktopLayout = !(isMobileUserAgent(userAgent) || clientHintMobile);

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
      <Suspense fallback={<StorefrontMenuPageLoading />}>
        <ComboMenuPageLoader
          menuQuery={menuQuery}
          rawCategorySlug={rawCategorySlug}
          selectedSearchQuery={selectedSearchQuery}
          minPriceAmd={minPriceAmd}
          maxPriceAmd={maxPriceAmd}
          tasteFilter={tasteFilter}
          renderDesktopLayout={renderDesktopLayout}
        />
      </Suspense>
    </div>
  );
}
