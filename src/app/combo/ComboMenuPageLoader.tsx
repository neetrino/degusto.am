import { Suspense } from 'react';
import { FigmaDesktopComboPage } from '@/components/home/FigmaDesktopComboPage';
import { StorefrontMenuPageShell } from '@/components/home/StorefrontMenuPageShell';
import { getComboMenuData } from '@/lib/services/combo-page/combo-page-data.service';
import type { ComboMenuQuery } from '@/lib/services/combo-page/combo-page-query.types';

type ComboMenuPageLoaderProps = {
  menuQuery: ComboMenuQuery;
  rawCategorySlug: string;
  selectedSearchQuery: string;
  minPriceAmd: number | null;
  maxPriceAmd: number | null;
  tasteFilter: 'leaf' | 'pepper' | null;
  renderDesktopLayout: boolean;
};

/**
 * Suspends until combo menu data is ready; uses the fast first-paint product query path.
 */
export async function ComboMenuPageLoader({
  menuQuery,
  rawCategorySlug,
  selectedSearchQuery,
  minPriceAmd,
  maxPriceAmd,
  tasteFilter,
  renderDesktopLayout,
}: ComboMenuPageLoaderProps) {
  const { cards, categories, showCategoryPicker, effectivePage, totalPages } = await getComboMenuData({
    ...menuQuery,
    menuFast: true,
  });

  const shellProps = {
    routeBasePath: '/combo' as const,
    titleKey: 'common.navigation.combo',
    subtitleKey: 'home.figma.desktop.combo.subtitle',
    cards,
    categories,
    activeCategorySlug: rawCategorySlug,
    showMobileProductsList: true,
    renderDesktopLayout,
  };

  return (
    <Suspense fallback={<StorefrontMenuPageShell {...shellProps} />}>
      <FigmaDesktopComboPage
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
        showMobileProductsList
        renderDesktopLayout={renderDesktopLayout}
        showCategoryPicker={showCategoryPicker}
      />
    </Suspense>
  );
}
