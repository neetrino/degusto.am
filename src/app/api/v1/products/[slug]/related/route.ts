import { NextRequest, NextResponse } from "next/server";
import { problemTypes } from "@/lib/http/problem-details";
import {
  STOREFRONT_CACHE_KEYS,
  STOREFRONT_CACHE_TTL,
  readJsonCache,
  writeJsonCache,
} from "@/lib/cache/storefront-cache";
import { resolveStorefrontLocaleFromSearchParams } from "@/lib/i18n/locale";
import { findRelatedByProductSlug } from "@/lib/services/products-slug/product-related.service";
import { getRelatedProductsBatchForPdp } from "@/lib/services/products-slug/get-related-products-cached";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = resolveStorefrontLocaleFromSearchParams(searchParams);
    const offset = Number(searchParams.get("offset") ?? "0");
    const limit = Number(searchParams.get("limit") ?? "5");
    const safeOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0;
    const safeLimit = Number.isFinite(limit) && limit >= 1 ? Math.min(limit, 5) : 5;
    const { slug } = await params;

    if (safeOffset > 0) {
      const batched = await getRelatedProductsBatchForPdp(
        slug,
        lang,
        safeOffset,
        safeLimit
      );
      return NextResponse.json({ data: batched.data, meta: { total: batched.total } });
    }

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
