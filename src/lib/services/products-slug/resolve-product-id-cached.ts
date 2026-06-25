import {
  readJsonCache,
  STOREFRONT_CACHE_KEYS,
  STOREFRONT_CACHE_TTL,
  writeJsonCache,
} from "@/lib/cache/storefront-cache";
import { resolveProductIdBySlug } from "@/lib/services/products-slug/product-query-builder";

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
    void writeJsonCache(cacheKey, STOREFRONT_CACHE_TTL.productDetails, { id: productId });
  }
  return productId;
}
