import { NextRequest, NextResponse } from "next/server";
import { problemTypes } from "@/lib/http/problem-details";
import {
  STOREFRONT_CACHE_KEYS,
  STOREFRONT_CACHE_TTL,
  readJsonCache,
  writeJsonCache,
} from "@/lib/cache/storefront-cache";
import { resolveStorefrontLocaleFromSearchParams } from "@/lib/i18n/locale";
import { findVisualBySlug, type ProductVisualPayload } from "@/lib/services/products-slug/product-visual.service";
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
    const cacheKey = STOREFRONT_CACHE_KEYS.productVisual(lang, slug);
    const cached = await readJsonCache<ProductVisualPayload>(cacheKey);
    if (cached) {
      return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
    }

    const body = await findVisualBySlug(slug, lang);
    if (!body) {
      return NextResponse.json(
        {
          type: problemTypes.notFound,
          title: "Product not found",
          status: 404,
          detail: `Product with slug '${slug}' does not exist or is not published`,
          instance: req.url,
        },
        { status: 404 }
      );
    }

    await writeJsonCache(cacheKey, STOREFRONT_CACHE_TTL.productVisual, body);
    return NextResponse.json(body, { headers: { "X-Cache": "MISS" } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("GET product visual failed", { error: message });
    return NextResponse.json(
      {
        type: problemTypes.internalError,
        title: "Internal Server Error",
        status: 500,
        detail: message,
        instance: req.url,
      },
      { status: 500 }
    );
  }
}
