import { cache } from "react";
import { productsSlugService } from "@/lib/services/products-slug.service";
import {
  getStorefrontLocaleFallbackChain,
  type StorefrontLocale,
} from "@/lib/i18n/locale";

export type ProductPageData = Awaited<ReturnType<typeof productsSlugService.findBySlug>>;

export type ProductPageLoadResult =
  | { status: "ok"; product: ProductPageData }
  | { status: "not_found" };

async function loadProductPageDataUncached(
  slug: string,
  locale: StorefrontLocale
): Promise<ProductPageLoadResult> {
  const fallbacks = getStorefrontLocaleFallbackChain(locale);

  for (let index = 0; index < fallbacks.length; index += 1) {
    const candidateLocale = fallbacks[index];
    try {
      const product = await productsSlugService.findBySlug(slug, candidateLocale);
      return { status: "ok", product };
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
 * Per-request deduped product load for PDP server components + `generateMetadata`.
 */
export const getProductPageData = cache(loadProductPageDataUncached);
