import { cache } from "react";
import { unstable_cache } from "next/cache";
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

const PDP_PAGE_REVALIDATE_SECONDS = 60;

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
    try {
      const product = await productsSlugService.findBySlug(slug, candidateLocale);
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

const getProductPageDataCached = unstable_cache(
  async (slug: string, locale: StorefrontLocale) => loadProductPageDataUncached(slug, locale),
  ["pdp-page-data-v2"],
  {
    revalidate: PDP_PAGE_REVALIDATE_SECONDS,
  }
);

/**
 * Per-request deduped + Data Cache (60s) for PDP server components and metadata.
 */
export function getProductPageData(
  slug: string,
  locale: StorefrontLocale
): Promise<ProductPageLoadResult> {
  return cache(async (s: string, l: StorefrontLocale) => {
    const data = await getProductPageDataCached(s, l);
    return data;
  })(slug, locale);
}
