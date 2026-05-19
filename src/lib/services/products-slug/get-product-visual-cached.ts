import { cache } from "react";
import { unstable_cache } from "next/cache";
import { findVisualBySlug } from "@/lib/services/products-slug/product-visual.service";
import type { ProductVisualPayload } from "@/lib/services/products-slug/product-visual.service";
import type { StorefrontLocale } from "@/lib/i18n/locale";
import { pdpPageCacheTag } from "@/lib/services/products-slug/get-product-page-data";

const PDP_VISUAL_REVALIDATE_SECONDS = 60;

const getProductVisualUncached = unstable_cache(
  async (slug: string, locale: StorefrontLocale): Promise<ProductVisualPayload | null> =>
    findVisualBySlug(slug, locale),
  ["pdp-visual-v1"],
  {
    revalidate: PDP_VISUAL_REVALIDATE_SECONDS,
  }
);

/**
 * Fast PDP visual payload (per-request dedupe + Data Cache).
 * Used to stream gallery/title before the full slug query finishes.
 */
export function getProductVisualCached(
  slug: string,
  locale: StorefrontLocale
): Promise<ProductVisualPayload | null> {
  return cache(async (s: string, l: StorefrontLocale) => {
    const visual = await getProductVisualUncached(s, l);
    return visual;
  })(slug, locale);
}

export { pdpPageCacheTag };
