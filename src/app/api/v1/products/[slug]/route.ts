import { NextRequest, NextResponse } from "next/server";
import { problemTypes } from "@/lib/http/problem-details";
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
import { buildLocalizedProblem } from "@/lib/i18n/api-problem";
import { productsService } from "@/lib/services/products.service";
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

    let result: unknown;
    const fallbacks = getStorefrontLocaleFallbackChain(lang);
    for (let index = 0; index < fallbacks.length; index += 1) {
      const candidateLocale = fallbacks[index];
      try {
        result = await productsService.findBySlug(slug, candidateLocale);
        break;
      } catch (error: unknown) {
        const err = error as { status?: number };
        const isLastLocale = index === fallbacks.length - 1;
        if (err?.status !== 404 || isLastLocale) {
          throw error;
        }
      }
    }

    await writeJsonCache(cacheKey, STOREFRONT_CACHE_TTL.productDetails, result);
    return NextResponse.json(result, { headers: { "X-Cache": "MISS" } });
  } catch (error: unknown) {
    const err = error as { type?: string; title?: string; status?: number; detail?: string; message?: string };
    logger.error("GET product by slug failed", { error: err?.message ?? String(error) });
    const status = err.status || 500;
    return NextResponse.json(
      buildLocalizedProblem(req, {
        type: err.type || problemTypes.internalError,
        status,
        titleKey: "internalErrorTitle",
        detailKey: "internalErrorDetail",
        detailOverride: err.detail || err.message,
        titleOverride: err.title,
        instance: req.url,
      }),
      { status }
    );
  }
}

