import { cache } from "react";
import { unstable_cache } from "next/cache";
import {
  readJsonCache,
  STOREFRONT_CACHE_KEYS,
  STOREFRONT_CACHE_TTL,
  writeJsonCache,
} from "@/lib/cache/storefront-cache";
import type { StorefrontLocale } from "@/lib/i18n/locale";
import { findRelatedByProductSlug } from "./product-related.service";
import type { RelatedCardPayload } from "./product-related-transform";
import { pdpPageCacheTag } from "./get-product-page-data";

async function loadRelatedProductsUncached(
  slug: string,
  locale: StorefrontLocale
): Promise<RelatedCardPayload[]> {
  const cacheKey = STOREFRONT_CACHE_KEYS.productRelated(locale, slug);
  const cached = await readJsonCache<{ data: RelatedCardPayload[] }>(cacheKey);
  if (cached?.data) {
    return cached.data;
  }

  const body = await findRelatedByProductSlug(slug, locale);
  await writeJsonCache(cacheKey, STOREFRONT_CACHE_TTL.productRelated, body);
  return body.data;
}

/**
 * SSR + Data Cache + Redis for PDP related carousel (same payload as `/related` API).
 */
export function getRelatedProductsForPdp(
  slug: string,
  locale: StorefrontLocale
): Promise<RelatedCardPayload[]> {
  return cache(async (s: string, l: StorefrontLocale) => {
    return unstable_cache(
      () => loadRelatedProductsUncached(s, l),
      ["pdp-related-v1", s, l],
      {
        revalidate: STOREFRONT_CACHE_TTL.productRelated,
        tags: [pdpPageCacheTag(s)],
      }
    )();
  })(slug, locale);
}
