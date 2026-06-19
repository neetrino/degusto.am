import { Suspense } from 'react';
import { FigmaDesktopMenuPage } from '@/components/home/FigmaDesktopShopPage';
import { StorefrontMenuPageShell } from '@/components/home/StorefrontMenuPageShell';
import { getShopMenuData } from '@/lib/services/shop-page/shop-page-data.service';
import type { ShopMenuQuery } from '@/lib/services/shop-page/shop-page-query.types';

type ShopMenuPageLoaderProps = {
  menuQuery: ShopMenuQuery;
  titleKey: string;
  subtitleKey: string;
  rawCategorySlug: string;
  selectedSearchQuery: string;
  minPriceAmd: number | null;
  maxPriceAmd: number | null;
  tasteFilter: 'leaf' | 'pepper' | null;
  showMobileProductsList: boolean;
};

/**
 * Suspends until shop menu data is ready; uses the fast first-paint product query path.
 */
export async function ShopMenuPageLoader({
  menuQuery,
  titleKey,
  subtitleKey,
  rawCategorySlug,
  selectedSearchQuery,
  minPriceAmd,
  maxPriceAmd,
  tasteFilter,
  showMobileProductsList,
}: ShopMenuPageLoaderProps) {
  const { cards, categories, showCategoryPicker, effectivePage, totalPages } = await getShopMenuData({
    ...menuQuery,
    menuFast: true,
  });

  const shellProps = {
    routeBasePath: '/shop' as const,
    titleKey,
    subtitleKey,
    cards,
    categories,
    activeCategorySlug: rawCategorySlug,
    showMobileProductsList,
  };

  return (
    <Suspense fallback={<StorefrontMenuPageShell {...shellProps} />}>
      <FigmaDesktopMenuPage
        titleKey={titleKey}
        subtitleKey={subtitleKey}
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
        showMobileProductsList={showMobileProductsList}
        showCategoryPicker={showCategoryPicker}
      />
    </Suspense>
  );
}
