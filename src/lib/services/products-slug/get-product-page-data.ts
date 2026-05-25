import { cache } from "react";
import { unstable_cache } from "next/cache";
import {
  readJsonCache,
  STOREFRONT_CACHE_KEYS,
  STOREFRONT_CACHE_TTL,
  writeJsonCache,
} from "@/lib/cache/storefront-cache";
import { productsSlugService } from "@/lib/services/products-slug.service";
import { getProductReviewSummary } from "@/lib/services/reviews/product-review-summary";
import type { ProductReviewSummary } from "@/lib/services/reviews/product-review-summary";
import {
  getStorefrontLocaleFallbackChain,
  type StorefrontLocale,
} from "@/lib/i18n/locale";

export type ProductPageData = Awaited<ReturnType<typeof productsSlugService.findBySlug>>;

export type ProductPageLoadResult =
  | { status: "ok"; product: ProductPageData; reviewSummary: ProductReviewSummary }
  | { status: "not_found" };

const PDP_PAGE_REVALIDATE_SECONDS = STOREFRONT_CACHE_TTL.productDetails;

/** `revalidateTag(\`pdp-page:${slug}\`)` on admin product writes. */
export function pdpPageCacheTag(slug: string): string {
  return `pdp-page:${slug}`;
}

async function loadProductPageDataUncached(
  slug: string,
  locale: StorefrontLocale
): Promise<ProductPageLoadResult> {
  const fallbacks = getStorefrontLocaleFallbackChain(locale);

  for (let index = 0; index < fallbacks.length; index += 1) {
    const candidateLocale = fallbacks[index];
    const cacheKey = STOREFRONT_CACHE_KEYS.productDetails(candidateLocale, slug);
    const cached = await readJsonCache<ProductPageData>(cacheKey);
    if (cached) {
      const reviewSummary = await getProductReviewSummary(cached.id);
      return { status: "ok", product: cached, reviewSummary };
    }

    try {
      const product = await productsSlugService.findBySlug(slug, candidateLocale);
      await writeJsonCache(cacheKey, STOREFRONT_CACHE_TTL.productDetails, product);
      const reviewSummary = await getProductReviewSummary(product.id);
      return { status: "ok", product, reviewSummary };
    } catch (error: unknown) {
      const err = error as { status?: number };
      const isLastLocale = index === fallbacks.length - 1;
      if (err?.status !== 404 || isLastLocale) {
        throw error;
      }
    }
  }

  return { status: "not_found" };
}

/**
 * Per-request deduped + Data Cache + Redis for PDP server render.
 */
export function getProductPageData(
  slug: string,
  locale: StorefrontLocale
): Promise<ProductPageLoadResult> {
  return cache(async (s: string, l: StorefrontLocale) => {
    return unstable_cache(
      () => loadProductPageDataUncached(s, l),
      ["pdp-page-data-v3", s, l],
      {
        revalidate: PDP_PAGE_REVALIDATE_SECONDS,
        tags: [pdpPageCacheTag(s)],
      }
    )();
  })(slug, locale);
}
