import { NextRequest, NextResponse } from "next/server";
import { problemTypes } from "@/lib/http/problem-details";
import {
  STOREFRONT_CACHE_KEYS,
  STOREFRONT_CACHE_TTL,
  readJsonCache,
  stableSearchParamsKey,
  writeJsonCache,
} from "@/lib/cache/storefront-cache";
import { buildLocalizedProblem } from "@/lib/i18n/api-problem";
import { resolveStorefrontLocaleFromSearchParams } from "@/lib/i18n/locale";
import { productsService } from "@/lib/services/products.service";
import { logger } from "@/lib/utils/logger";

export async function GET(req: NextRequest) {
  try {
    let searchParams: URLSearchParams;
    try {
      const url = req.url || "";
      searchParams = new URL(url).searchParams;
    } catch (urlError) {
      logger.error("[PRODUCTS FILTERS] Invalid request URL", urlError);
      return NextResponse.json(
        buildLocalizedProblem(req, {
          type: problemTypes.internalError,
          status: 500,
          titleKey: "internalErrorTitle",
          detailKey: "internalErrorDetail",
          detailOverride: "Invalid request URL",
          instance: req.url || "",
        }),
        { status: 500 }
      );
    }

    const lang = resolveStorefrontLocaleFromSearchParams(searchParams);
    const filters = {
      category: searchParams.get("category") || undefined,
      search: searchParams.get("search") || undefined,
      minPrice: searchParams.get("minPrice")
        ? parseFloat(searchParams.get("minPrice")!)
        : undefined,
      maxPrice: searchParams.get("maxPrice")
        ? parseFloat(searchParams.get("maxPrice")!)
        : undefined,
      lang,
    };

    const cacheKey = STOREFRONT_CACHE_KEYS.productsFilters(stableSearchParamsKey(searchParams));
    const cached = await readJsonCache<unknown>(cacheKey);
    if (cached !== null) {
      return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
    }

    const result = await productsService.getFilters(filters);
    await writeJsonCache(cacheKey, STOREFRONT_CACHE_TTL.productsFilters, result);

    return NextResponse.json(result, { headers: { "X-Cache": "MISS" } });
  } catch (error: unknown) {
    const err = error as { type?: string; title?: string; status?: number; message?: string };
    logger.error("[PRODUCTS FILTERS] Error", error);
    const status = err.status || 500;
    return NextResponse.json(
      buildLocalizedProblem(req, {
        type: err.type || problemTypes.internalError,
        status,
        titleKey: "internalErrorTitle",
        detailKey: "internalErrorDetail",
        detailOverride: err.message,
        titleOverride: err.title,
        instance: req.url || "",
      }),
      { status }
    );
  }
}
