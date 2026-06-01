import { revalidatePath, revalidateTag } from "next/cache";
import { revalidateStorefrontMenuCaches } from "@/lib/cache/revalidate-storefront-menu-caches";
import {
  invalidateProductPageCaches,
  invalidateStorefrontProductRelatedCaches,
} from "@/lib/cache/storefront-cache";
import { pdpPageCacheTag } from "@/lib/services/products-slug/get-product-page-data";
import { warmProductPageCaches } from "@/lib/services/products-slug/warm-product-page-caches";
import { logger } from "../../../utils/logger";
import { cacheService } from "../../cache.service";

function uniqueSlugs(slugs: readonly string[]): string[] {
  return Array.from(new Set(slugs.map((slug) => slug.trim()).filter((slug) => slug.length > 0)));
}

/**
 * Revalidate cache for product and related pages, then pre-warm PDP caches.
 */
export async function revalidateProductCache(
  productId: string,
  productSlug: string | undefined,
  translationSlugs: readonly string[] = []
) {
  try {
    logger.debug("Revalidating paths for product", { productId });
    const slugsToWarm = uniqueSlugs(
      translationSlugs.length > 0
        ? translationSlugs
        : productSlug
          ? [productSlug]
          : []
    );

    for (const slug of slugsToWarm) {
      revalidatePath(`/products/${slug}`);
      // @ts-expect-error - revalidateTag type issue in Next.js
      revalidateTag(pdpPageCacheTag(slug));
    }

    revalidateStorefrontMenuCaches();
    // @ts-expect-error - revalidateTag type issue in Next.js
    revalidateTag("products");
    // @ts-expect-error - revalidateTag type issue in Next.js
    revalidateTag(`product-${productId}`);

    await cacheService.deletePattern("products:*");
    await invalidateProductPageCaches();
    await invalidateStorefrontProductRelatedCaches();

    if (slugsToWarm.length > 0) {
      await warmProductPageCaches(slugsToWarm);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.warn("Revalidation failed (expected in some environments)", {
      error: errorMessage,
    });
  }
}
