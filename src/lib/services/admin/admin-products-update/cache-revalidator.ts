import { revalidatePath, revalidateTag } from "next/cache";
import { revalidateStorefrontMenuCaches } from "@/lib/cache/revalidate-storefront-menu-caches";
import {
  invalidateProductPageCaches,
  invalidateStorefrontProductRelatedCaches,
} from "@/lib/cache/storefront-cache";
import { pdpPageCacheTag } from "@/lib/services/products-slug/get-product-page-data";
import { logger } from "../../../utils/logger";
import { cacheService } from "../../cache.service";

/**
 * Revalidate cache for product and related pages
 */
export async function revalidateProductCache(
  productId: string,
  productSlug: string | undefined
) {
  try {
    logger.debug('Revalidating paths for product', { productId });
    if (productSlug) {
      revalidatePath(`/products/${productSlug}`);
      // @ts-expect-error - revalidateTag type issue in Next.js
      revalidateTag(pdpPageCacheTag(productSlug));
    }
    revalidateStorefrontMenuCaches();
    // @ts-expect-error - revalidateTag type issue in Next.js
    revalidateTag('products');
    // @ts-expect-error - revalidateTag type issue in Next.js
    revalidateTag(`product-${productId}`);

    await cacheService.deletePattern("products:*");
    await invalidateProductPageCaches();
    await invalidateStorefrontProductRelatedCaches();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.warn('Revalidation failed (expected in some environments)', { error: errorMessage });
  }
}




