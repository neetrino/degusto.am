import { cache } from "react";
import { unstable_cache } from "next/cache";
import {
  readJsonCache,
  STOREFRONT_CACHE_KEYS,
  STOREFRONT_CACHE_TTL,
  writeJsonCache,
} from "@/lib/cache/storefront-cache";
import { findVisualBySlug } from "@/lib/services/products-slug/product-visual.service";
import type { ProductVisualPayload } from "@/lib/services/products-slug/product-visual.service";
import type { StorefrontLocale } from "@/lib/i18n/locale";
import { pdpPageCacheTag } from "@/lib/services/products-slug/get-product-page-data";

const PDP_VISUAL_REVALIDATE_SECONDS = STOREFRONT_CACHE_TTL.productVisual;

async function loadProductVisualUncached(
  slug: string,
  locale: StorefrontLocale
): Promise<ProductVisualPayload | null> {
  const cacheKey = STOREFRONT_CACHE_KEYS.productVisual(locale, slug);
  const cached = await readJsonCache<ProductVisualPayload>(cacheKey);
  if (cached) {
    return cached;
  }

  const body = await findVisualBySlug(slug, locale);
  if (body) {
    await writeJsonCache(cacheKey, STOREFRONT_CACHE_TTL.productVisual, body);
  }
  return body;
}

/**
 * Fast PDP visual payload (per-request dedupe + Data Cache + Redis).
 */
export function getProductVisualCached(
  slug: string,
  locale: StorefrontLocale
): Promise<ProductVisualPayload | null> {
  return cache(async (s: string, l: StorefrontLocale) => {
    return unstable_cache(
      () => loadProductVisualUncached(s, l),
      ["pdp-visual-v2", s, l],
      {
        revalidate: PDP_VISUAL_REVALIDATE_SECONDS,
        tags: [pdpPageCacheTag(s)],
      }
    )();
  })(slug, locale);
}

export { pdpPageCacheTag };
