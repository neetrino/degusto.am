import { logger } from "@/lib/utils/logger";
import { STOREFRONT_LOCALES } from "@/lib/i18n/locale";
import { getProductPageData } from "@/lib/services/products-slug/get-product-page-data";

/**
 * Pre-populate Redis + Data Cache after admin product writes (avoids first visitor cold path).
 */
export async function warmProductPageCaches(slugs: readonly string[]): Promise<void> {
  const uniqueSlugs = Array.from(
    new Set(slugs.map((slug) => slug.trim()).filter((slug) => slug.length > 0))
  );
  if (uniqueSlugs.length === 0) {
    return;
  }

  const tasks = uniqueSlugs.flatMap((slug) =>
    STOREFRONT_LOCALES.map((locale) => getProductPageData(slug, locale))
  );

  const results = await Promise.allSettled(tasks);
  const failed = results.filter((result) => result.status === "rejected").length;
  if (failed > 0) {
    logger.debug("PDP cache warm completed with partial failures", {
      slugs: uniqueSlugs,
      failed,
      total: results.length,
    });
  } else {
    logger.debug("PDP cache warm completed", {
      slugs: uniqueSlugs,
      warmed: results.length,
    });
  }
}
