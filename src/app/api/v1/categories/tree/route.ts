import { NextRequest, NextResponse } from "next/server";
import {
  STOREFRONT_CACHE_KEYS,
  STOREFRONT_CACHE_TTL,
  readJsonCache,
  writeJsonCache,
} from "@/lib/cache/storefront-cache";
import { apiRouteErrorResponse } from "@/lib/http/api-route-errors";
import { categoriesService } from "@/lib/services/categories.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get("lang") || "en";
    const cacheKey = STOREFRONT_CACHE_KEYS.categoriesTree(lang);

    const cached = await readJsonCache<unknown>(cacheKey);
    if (cached !== null) {
      return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
    }

    const result = await categoriesService.getTree(lang);
    await writeJsonCache(cacheKey, STOREFRONT_CACHE_TTL.categoriesTree, result);

    return NextResponse.json(result, { headers: { "X-Cache": "MISS" } });
  } catch (error: unknown) {
    return apiRouteErrorResponse(req, error, "[CATEGORIES TREE]");
  }
}
