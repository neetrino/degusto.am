import { NextRequest, NextResponse } from "next/server";
import {
  STOREFRONT_CACHE_KEYS,
  STOREFRONT_CACHE_TTL,
  readJsonCache,
  writeJsonCache,
} from "@/lib/cache/storefront-cache";
import { findRelatedByProductSlug } from "@/lib/services/products-slug/product-related.service";
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
    const cacheKey = STOREFRONT_CACHE_KEYS.productRelated(lang, slug);
    const cached = await readJsonCache<unknown>(cacheKey);
    if (cached) {
      return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
    }

    const body = await findRelatedByProductSlug(slug, lang);
    await writeJsonCache(cacheKey, STOREFRONT_CACHE_TTL.productRelated, body);
    return NextResponse.json(body, { headers: { "X-Cache": "MISS" } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("GET product related failed", { error: message });
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
