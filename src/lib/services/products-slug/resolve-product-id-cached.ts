import {
  readJsonCache,
  STOREFRONT_CACHE_KEYS,
  writeJsonCache,
} from "@/lib/cache/storefront-cache";
import { resolveProductIdBySlug } from "@/lib/services/products-slug/product-query-builder";

const SLUG_ID_CACHE_TTL_SECONDS = 3600;

/**
 * Redis-backed slug → product id (avoids extra Neon round trip on repeat PDP loads).
 */
export async function resolveProductIdBySlugCached(slug: string): Promise<string | null> {
  const cacheKey = STOREFRONT_CACHE_KEYS.productSlugId(slug);
  const cached = await readJsonCache<{ id: string }>(cacheKey);
  if (cached?.id) {
    return cached.id;
  }

  const productId = await resolveProductIdBySlug(slug);
  if (productId) {
    void writeJsonCache(cacheKey, SLUG_ID_CACHE_TTL_SECONDS, { id: productId });
  }
  return productId;
}
