import { adminService } from '@/lib/services/admin.service';
import { getDailyOfferSelection } from '@/lib/services/daily-offer/daily-offer.service';
import type { DailyOfferSelection } from '@/lib/services/daily-offer/daily-offer.types';

export type AdminProductsPageData = {
  categories: Awaited<ReturnType<typeof adminService.getCategories>>['data'];
  dailyOfferSelection: DailyOfferSelection;
};

/**
 * Single round-trip payload for the admin products list screen (filters sidebar + daily-offer badges).
 */
export async function loadAdminProductsPageData(
  locale?: string
): Promise<AdminProductsPageData> {
  const [categoriesResult, dailyOfferSelection] = await Promise.all([
    adminService.getCategories(locale),
    getDailyOfferSelection(),
  ]);

  return {
    categories: categoriesResult.data ?? [],
    dailyOfferSelection,
  };
}
