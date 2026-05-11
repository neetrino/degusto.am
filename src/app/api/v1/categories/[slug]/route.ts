import { NextRequest, NextResponse } from "next/server";
import {
  STOREFRONT_CACHE_KEYS,
  STOREFRONT_CACHE_TTL,
  readJsonCache,
  writeJsonCache,
} from "@/lib/cache/storefront-cache";
import { categoriesService } from "@/lib/services/categories.service";
import { logger } from "@/lib/utils/logger";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get("lang") || "en";
    const { slug } = await params;
    const cacheKey = STOREFRONT_CACHE_KEYS.categoryBySlug(lang, slug);

    const cached = await readJsonCache<unknown>(cacheKey);
    if (cached !== null) {
      return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
    }

    const result = await categoriesService.findBySlug(slug, lang);
    await writeJsonCache(cacheKey, STOREFRONT_CACHE_TTL.categoryBySlug, result);

    return NextResponse.json(result, { headers: { "X-Cache": "MISS" } });
  } catch (error: unknown) {
    const err = error as {
      type?: string;
      title?: string;
      status?: number;
      detail?: string;
      message?: string;
    };
    logger.error("[CATEGORIES SLUG] Error", error);
    const status = err.status ?? 500;
    return NextResponse.json(
      {
        type: err.type || "https://api.shop.am/problems/internal-error",
        title: err.title || "Internal Server Error",
        status,
        detail: err.detail || err.message || "An error occurred",
        instance: req.url,
      },
      { status }
    );
  }
}
