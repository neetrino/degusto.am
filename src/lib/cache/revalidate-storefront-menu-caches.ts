import { revalidatePath, revalidateTag } from 'next/cache';
import { COMBO_MENU_CACHE_TAG } from '@/lib/services/combo-page/combo-page-data.service';
import { HOME_PAGE_CACHE_TAG } from '@/lib/services/home-page-data.service';
import { SHOP_MENU_CACHE_TAG } from '@/lib/services/shop-page/shop-page-data.service';

/**
 * Invalidates Next.js Data Cache for home, shop, and combo menu routes.
 * Call after admin product or category writes that affect storefront menus.
 */
export function revalidateStorefrontMenuCaches(): void {
  revalidatePath('/');
  revalidatePath('/shop');
  revalidatePath('/combo');
  // @ts-expect-error - revalidateTag type issue in Next.js
  revalidateTag(HOME_PAGE_CACHE_TAG);
  // @ts-expect-error - revalidateTag type issue in Next.js
  revalidateTag(SHOP_MENU_CACHE_TAG);
  // @ts-expect-error - revalidateTag type issue in Next.js
  revalidateTag(COMBO_MENU_CACHE_TAG);
}
