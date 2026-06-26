import { Suspense } from 'react';
import { BodyBackground } from '@/components/BodyBackground';
import { StorefrontLocaleUrlSync } from '@/components/routing/StorefrontLocaleUrlSync';
import { ShopMenuRouteLoadingFallback } from '@/components/routing/ShopMenuRouteLoadingFallback';
import { ShopPageContent } from './ShopPageContent';

type SearchParamsInput = Record<string, string | string[] | undefined>;

/** Keep in sync with `STOREFRONT_ISR_REVALIDATE_SECONDS` in `@/constants/storefront-isr`. */
export const revalidate = 86_400;

export default async function ShopPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParamsInput>;
}) {
  const params = (await searchParams) ?? {};

  return (
    <div className="min-h-screen bg-white">
      <BodyBackground color="#ffffff" />
      <Suspense fallback={null}>
        <StorefrontLocaleUrlSync />
      </Suspense>
      <Suspense fallback={<ShopMenuRouteLoadingFallback ariaLabel="Loading shop" />}>
        <ShopPageContent params={params} />
      </Suspense>
    </div>
  );
}
