import { NextRequest, NextResponse } from "next/server";
import {
  STOREFRONT_CACHE_KEYS,
  STOREFRONT_CACHE_TTL,
  readJsonCache,
  writeJsonCache,
} from "@/lib/cache/storefront-cache";
import { getCategoryNavigationPreviews } from "@/lib/services/categories-navigation-previews.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get("lang") || "en";
    const cacheKey = STOREFRONT_CACHE_KEYS.navigationPreviews(lang);

    const cached = await readJsonCache<{ data: unknown }>(cacheKey);
    if (cached !== null) {
      return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
    }

    const data = await getCategoryNavigationPreviews(lang);
    const body = { data };
    await writeJsonCache(cacheKey, STOREFRONT_CACHE_TTL.navigationPreviews, body);

    return NextResponse.json(body, { headers: { "X-Cache": "MISS" } });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      {
        type: "https://api.shop.am/problems/internal-error",
        title: "Internal Server Error",
        status: 500,
        detail: err.message || "An error occurred",
        instance: req.url,
      },
      { status: 500 }
    );
  }
}
