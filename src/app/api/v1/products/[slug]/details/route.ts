import { NextRequest, NextResponse } from "next/server";
import {
  STOREFRONT_CACHE_KEYS,
  STOREFRONT_CACHE_TTL,
  readJsonCache,
  writeJsonCache,
} from "@/lib/cache/storefront-cache";
import {
  getStorefrontLocaleFallbackChain,
  resolveStorefrontLocaleFromSearchParams,
} from "@/lib/i18n/locale";
import { productsSlugService } from "@/lib/services/products-slug.service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = resolveStorefrontLocaleFromSearchParams(searchParams);
    const { slug } = await params;
    const cacheKey = STOREFRONT_CACHE_KEYS.productDetails(lang, slug);
    const cached = await readJsonCache<unknown>(cacheKey);
    if (cached) {
      return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
    }

    let body: unknown;
    const fallbacks = getStorefrontLocaleFallbackChain(lang);
    for (let index = 0; index < fallbacks.length; index += 1) {
      const candidateLocale = fallbacks[index];
      try {
        body = await productsSlugService.findBySlug(slug, candidateLocale);
        break;
      } catch (error: unknown) {
        const err = error as { status?: number };
        const isLastLocale = index === fallbacks.length - 1;
        if (err?.status !== 404 || isLastLocale) {
          throw error;
        }
      }
    }

    await writeJsonCache(cacheKey, STOREFRONT_CACHE_TTL.productDetails, body);
    return NextResponse.json(body, { headers: { "X-Cache": "MISS" } });
  } catch (error: unknown) {
    const err = error as { status?: number; title?: string; detail?: string; type?: string };
    if (err?.status === 404) {
      return NextResponse.json(
        {
          type: err.type || "https://api.shop.am/problems/not-found",
          title: err.title || "Product not found",
          status: 404,
          detail: err.detail || "Not found",
          instance: req.url,
        },
        { status: 404 }
      );
    }
    const message = error instanceof Error ? error.message : String(error);
    logger.error("GET product details failed", { error: message });
    return NextResponse.json(
      {
        type: "https://api.shop.am/problems/internal-error",
        title: "Internal Server Error",
        status: 500,
        detail: message,
        instance: req.url,
      },
      { status: 500 }
    );
  }
}
