import { FigmaDesktopComboPage } from '@/components/home/FigmaDesktopComboPage';
import { resolveStorefrontLocaleFromPageSearchParams } from '@/lib/i18n/locale';
import { getComboMenuData } from '@/lib/services/combo-page/combo-page-data.service';

type SearchParamsInput = Record<string, string | string[] | undefined>;

type ComboPageContentProps = {
  params: SearchParamsInput;
};

/** Async combo body — streamed inside Suspense so shell renders immediately on navigation. */
export async function ComboPageContent({ params }: ComboPageContentProps) {
  const locale = resolveStorefrontLocaleFromPageSearchParams(params);
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

  const { cards, categories, effectivePage, totalPages } = await getComboMenuData({
    locale,
    selectedCategorySlug,
    selectedSearchQuery,
    tasteFilter,
    minPriceAmd,
    maxPriceAmd,
    requestedPage,
  });

  return (
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
    />
  );
}
