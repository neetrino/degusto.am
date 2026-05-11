import { NextRequest, NextResponse } from "next/server";
import {
  STOREFRONT_CACHE_KEYS,
  STOREFRONT_CACHE_TTL,
  readJsonCache,
  stableSearchParamsKey,
  writeJsonCache,
} from "@/lib/cache/storefront-cache";
import { productsService } from "@/lib/services/products.service";
import { logger } from "@/lib/utils/logger";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filters = {
      category: searchParams.get("category") || undefined,
      lang: searchParams.get("lang") || "en",
    };

    const cacheKey = STOREFRONT_CACHE_KEYS.productsPriceRange(stableSearchParamsKey(searchParams));
    const cached = await readJsonCache<unknown>(cacheKey);
    if (cached !== null) {
      return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
    }

    const result = await productsService.getPriceRange(filters);
    await writeJsonCache(cacheKey, STOREFRONT_CACHE_TTL.productsPriceRange, result);

    return NextResponse.json(result, { headers: { "X-Cache": "MISS" } });
  } catch (error: unknown) {
    const err = error as { type?: string; title?: string; status?: number; message?: string };
    logger.error("[PRODUCTS PRICE-RANGE] Error", error);
    return NextResponse.json(
      {
        type: err.type || "https://api.shop.am/problems/internal-error",
        title: err.title || "Internal Server Error",
        status: err.status || 500,
        detail: err.message || "An error occurred",
        instance: req.url,
      },
      { status: err.status || 500 }
    );
  }
}
