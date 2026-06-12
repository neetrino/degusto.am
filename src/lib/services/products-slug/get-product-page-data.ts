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
import { resolveProductIdBySlugCached } from "@/lib/services/products-slug/resolve-product-id-cached";
import { getStorefrontDiscountSettings } from "@/lib/services/storefront/get-storefront-discount-settings";
import {
  getStorefrontLocaleFallbackChain,
  type StorefrontLocale,
} from "@/lib/i18n/locale";

export type ProductPageData = Awaited<ReturnType<typeof productsSlugService.findBySlug>>;

type PdpCachedBundle = {
  product: ProductPageData;
  reviewSummary: ProductReviewSummary;
};

export type ProductPageLoadResult =
  | {
      status: "ok";
      product: ProductPageData;
      reviewSummary: ProductReviewSummary;
    }
  | { status: "not_found" };

const PDP_PAGE_REVALIDATE_SECONDS = STOREFRONT_CACHE_TTL.productDetails;

export const EMPTY_REVIEW_SUMMARY: ProductReviewSummary = {
  count: 0,
  averageRating: 0,
};

/** `revalidateTag(\`pdp-page:${slug}\`)` on admin product writes. */
export function pdpPageCacheTag(slug: string): string {
  return `pdp-page:${slug}`;
}

async function readPdpBundleFromCache(
  locale: StorefrontLocale,
  slug: string
): Promise<PdpCachedBundle | null> {
  const bundleKey = STOREFRONT_CACHE_KEYS.productPdpBundle(locale, slug);
  const bundled = await readJsonCache<PdpCachedBundle>(bundleKey);
  if (bundled?.product && bundled.reviewSummary) {
    return bundled;
  }

  const legacyKey = STOREFRONT_CACHE_KEYS.productDetails(locale, slug);
  const legacyProduct = await readJsonCache<ProductPageData>(legacyKey);
  if (!legacyProduct) {
    return null;
  }

  const reviewSummary = await getProductReviewSummary(legacyProduct.id);
  const bundle: PdpCachedBundle = { product: legacyProduct, reviewSummary };
  void writePdpBundleToCache(locale, slug, bundle);
  return bundle;
}

async function writePdpBundleToCache(
  locale: StorefrontLocale,
  slug: string,
  bundle: PdpCachedBundle
): Promise<void> {
  await Promise.all([
    writeJsonCache(
      STOREFRONT_CACHE_KEYS.productPdpBundle(locale, slug),
      STOREFRONT_CACHE_TTL.productPdpBundle,
      bundle
    ),
    writeJsonCache(
      STOREFRONT_CACHE_KEYS.productDetails(locale, slug),
      STOREFRONT_CACHE_TTL.productDetails,
      bundle.product
    ),
  ]);
}

async function readFirstPdpBundleFromCache(
  slug: string,
  fallbacks: readonly StorefrontLocale[]
): Promise<PdpCachedBundle | null> {
  const hits = await Promise.all(
    fallbacks.map((locale) => readPdpBundleFromCache(locale, slug))
  );
  return hits.find((bundle) => bundle !== null) ?? null;
}

function schedulePdpBundlePersist(
  locale: StorefrontLocale,
  slug: string,
  productId: string,
  product: ProductPageData
): void {
  void (async () => {
    try {
      const reviewSummary = await getProductReviewSummary(productId);
      await writePdpBundleToCache(locale, slug, { product, reviewSummary });
    } catch {
      await writePdpBundleToCache(locale, slug, {
        product,
        reviewSummary: EMPTY_REVIEW_SUMMARY,
      });
    }
  })();
}

async function loadProductPageDataUncached(
  slug: string,
  locale: StorefrontLocale
): Promise<ProductPageLoadResult> {
  const fallbacks = getStorefrontLocaleFallbackChain(locale);

  const cached = await readFirstPdpBundleFromCache(slug, fallbacks);
  if (cached) {
    return {
      status: "ok",
      product: cached.product,
      reviewSummary: cached.reviewSummary,
    };
  }

  const productId = (
    await Promise.all([
      resolveProductIdBySlugCached(slug),
      getStorefrontDiscountSettings(),
    ])
  )[0];
  if (!productId) {
    return { status: "not_found" };
  }

  for (let index = 0; index < fallbacks.length; index += 1) {
    const candidateLocale = fallbacks[index];
    try {
      const product = await productsSlugService.findById(productId, candidateLocale);
      schedulePdpBundlePersist(candidateLocale, slug, productId, product);
      return {
        status: "ok",
        product,
        reviewSummary: EMPTY_REVIEW_SUMMARY,
      };
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
 * Reviews list loads client-side when near viewport; related carousel prefetched on SSR.
 */
export function getProductPageData(
  slug: string,
  locale: StorefrontLocale
): Promise<ProductPageLoadResult> {
  return cache(async (s: string, l: StorefrontLocale) => {
    return unstable_cache(
      () => loadProductPageDataUncached(s, l),
      ["pdp-page-data-v6", s, l],
      {
        revalidate: PDP_PAGE_REVALIDATE_SECONDS,
        tags: [pdpPageCacheTag(s)],
      }
    )();
  })(slug, locale);
}
