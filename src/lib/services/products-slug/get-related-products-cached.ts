import { cache } from "react";
import { unstable_cache } from "next/cache";
import {
  readJsonCache,
  STOREFRONT_CACHE_KEYS,
  STOREFRONT_CACHE_TTL,
  writeJsonCache,
} from "@/lib/cache/storefront-cache";
import type { StorefrontLocale } from "@/lib/i18n/locale";
import { withPrismaResilience } from "@/lib/db/with-prisma-resilience";
import { findRelatedByProductSlug } from "./product-related.service";
import type { RelatedCardPayload } from "./product-related-transform";
import { pdpPageCacheTag } from "./get-product-page-data";
import { logger } from "@/lib/utils/logger";

const PDP_RELATED_BATCH_SIZE = 5;
const PDP_RELATED_MAX = 10;

const PDP_RELATED_RESILIENCE_SCOPE = "PDP_RELATED";
const PDP_RELATED_RESILIENCE_STEP = "load related products";

async function loadRelatedProductsUncached(
  slug: string,
  locale: StorefrontLocale
): Promise<RelatedCardPayload[]> {
  const startedAt = Date.now();
  const cacheKey = STOREFRONT_CACHE_KEYS.productRelated(locale, slug);
  const cached = await readJsonCache<{ data: RelatedCardPayload[] }>(cacheKey);
  if (cached?.data) {
    logger.info("[PDP PERF] related products cache hit", {
      slug,
      locale,
      count: cached.data.length,
      durationMs: Date.now() - startedAt,
    });
    return cached.data;
  }

  const body = await findRelatedByProductSlug(slug, locale);
  const limited = body.data.slice(0, PDP_RELATED_MAX);
  await writeJsonCache(cacheKey, STOREFRONT_CACHE_TTL.productRelated, { data: limited });
  logger.info("[PDP PERF] related products cache miss", {
    slug,
    locale,
    count: limited.length,
    durationMs: Date.now() - startedAt,
  });
  return limited;
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
      () =>
        withPrismaResilience(
          () => loadRelatedProductsUncached(s, l),
          [] as RelatedCardPayload[],
          PDP_RELATED_RESILIENCE_SCOPE,
          PDP_RELATED_RESILIENCE_STEP
        ),
      ["pdp-related-v2", s, l],
      {
        revalidate: STOREFRONT_CACHE_TTL.productRelated,
        tags: [pdpPageCacheTag(s)],
      }
    )();
  })(slug, locale).then((items) => items.slice(0, PDP_RELATED_BATCH_SIZE));
}

export async function getRelatedProductsBatchForPdp(
  slug: string,
  locale: StorefrontLocale,
  offset: number,
  limit: number
): Promise<{ data: RelatedCardPayload[]; total: number }> {
  const safeOffset = Math.max(0, offset);
  const safeLimit = Math.min(Math.max(1, limit), PDP_RELATED_BATCH_SIZE);
  const pool = await cache(async (s: string, l: StorefrontLocale) => {
    return unstable_cache(
      () =>
        withPrismaResilience(
          () => loadRelatedProductsUncached(s, l),
          [] as RelatedCardPayload[],
          PDP_RELATED_RESILIENCE_SCOPE,
          PDP_RELATED_RESILIENCE_STEP
        ),
      ["pdp-related-v2", s, l],
      {
        revalidate: STOREFRONT_CACHE_TTL.productRelated,
        tags: [pdpPageCacheTag(s)],
      }
    )();
  })(slug, locale);
  const capped = pool.slice(0, PDP_RELATED_MAX);
  return {
    data: capped.slice(safeOffset, safeOffset + safeLimit),
    total: capped.length,
  };
}
