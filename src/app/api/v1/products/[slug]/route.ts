import { NextRequest, NextResponse } from "next/server";
import {
  STOREFRONT_CACHE_KEYS,
  STOREFRONT_CACHE_TTL,
  readJsonCache,
  writeJsonCache,
} from "@/lib/cache/storefront-cache";
import { productsService } from "@/lib/services/products.service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get("lang") || "en";
    const { slug } = await params;
    const cacheKey = STOREFRONT_CACHE_KEYS.productDetails(lang, slug);
    const cached = await readJsonCache<unknown>(cacheKey);
    if (cached) {
      return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
    }

    let result: unknown;
    try {
      result = await productsService.findBySlug(slug, lang);
    } catch (first: unknown) {
      const err = first as { status?: number };
      if (err?.status === 404 && lang !== "en") {
        result = await productsService.findBySlug(slug, "en");
      } else {
        throw first;
      }
    }

    await writeJsonCache(cacheKey, STOREFRONT_CACHE_TTL.productDetails, result);
    return NextResponse.json(result, { headers: { "X-Cache": "MISS" } });
  } catch (error: unknown) {
    const err = error as { type?: string; title?: string; status?: number; detail?: string; message?: string };
    logger.error("GET product by slug failed", { error: err?.message ?? String(error) });
    return NextResponse.json(
      {
        type: err.type || "https://api.shop.am/problems/internal-error",
        title: err.title || "Internal Server Error",
        status: err.status || 500,
        detail: err.detail || err.message || "An error occurred",
        instance: req.url,
      },
      { status: err.status || 500 }
    );
  }
}

