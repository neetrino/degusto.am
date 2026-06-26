import { NextRequest, NextResponse } from "next/server";
import { STOREFRONT_REDIS_TTL_SECONDS } from "@/constants/storefront-isr";
import { apiRouteErrorResponse } from "@/lib/http/api-route-errors";
import { resolveStorefrontLocaleFromSearchParams } from "@/lib/i18n/locale";
import { productsService } from "@/lib/services/products.service";
import { cacheService } from "@/lib/services/cache.service";

/** Long TTL — freshness from admin `invalidateLegacyProductsListCache` / product writes. */
const PRODUCTS_LIST_CACHE_TTL = STOREFRONT_REDIS_TTL_SECONDS;

function buildProductsCacheKey(searchParams: URLSearchParams): string {
  const sortedEntries = Array.from(searchParams.entries()).sort(([keyA], [keyB]) =>
    keyA.localeCompare(keyB)
  );
  const normalizedParams = new URLSearchParams();
  sortedEntries.forEach(([key, value]) => {
    normalizedParams.append(key, value);
  });
  return `products:${normalizedParams.toString()}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = resolveStorefrontLocaleFromSearchParams(searchParams);
    const idsParam = searchParams.get("ids");
    const ids = idsParam
      ? idsParam
          .split(",")
          .map((id) => id.trim())
          .filter((id) => id.length > 0)
      : undefined;
    const fieldsParam = searchParams.get("fields");
    const viewParam = searchParams.get("view");
    const view =
      viewParam === "card" || fieldsParam === "card" ? "card" : viewParam || undefined;

    const filters = {
      category: searchParams.get("category") || undefined,
      search: searchParams.get("search") || undefined,
      ids,
      view,
      filter: searchParams.get("filter") || searchParams.get("filters") || undefined,
      minPrice: searchParams.get("minPrice")
        ? parseFloat(searchParams.get("minPrice")!)
        : undefined,
      maxPrice: searchParams.get("maxPrice")
        ? parseFloat(searchParams.get("maxPrice")!)
        : undefined,
      colors: searchParams.get("colors") || undefined,
      sizes: searchParams.get("sizes") || undefined,
      sort: searchParams.get("sort") || "createdAt",
      page: searchParams.get("page")
        ? parseInt(searchParams.get("page")!)
        : 1,
      limit: Math.min(
        searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 12,
        200
      ),
      lang,
    };

    const cacheKey = buildProductsCacheKey(searchParams);
    const cached = await cacheService.get(cacheKey);
    if (cached !== null && cached !== undefined) {
      const data = typeof cached === "string" ? JSON.parse(cached) : cached;
      return NextResponse.json(data, {
        headers: { "X-Cache": "HIT" },
      });
    }

    const result = await productsService.findAll(filters);

    await cacheService.setex(cacheKey, PRODUCTS_LIST_CACHE_TTL, JSON.stringify(result));

    return NextResponse.json(result, {
      headers: { "X-Cache": "MISS" },
    });
  } catch (error: unknown) {
    return apiRouteErrorResponse(req, error, "[PRODUCTS]");
  }
}

