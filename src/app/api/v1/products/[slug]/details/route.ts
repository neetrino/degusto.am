import { NextRequest, NextResponse } from "next/server";
import {
  STOREFRONT_CACHE_KEYS,
  STOREFRONT_CACHE_TTL,
  readJsonCache,
  writeJsonCache,
} from "@/lib/cache/storefront-cache";
import { productsSlugService } from "@/lib/services/products-slug.service";
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

    let body: unknown;
    try {
      body = await productsSlugService.findBySlug(slug, lang);
    } catch (first: unknown) {
      const err = first as { status?: number };
      if (err?.status === 404 && lang !== "en") {
        body = await productsSlugService.findBySlug(slug, "en");
      } else {
        throw first;
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
