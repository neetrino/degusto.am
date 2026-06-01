import { NextRequest, NextResponse } from "next/server";
import { problemTypes } from "@/lib/http/problem-details";
import { resolveStorefrontLocaleFromSearchParams } from "@/lib/i18n/locale";
import { getProductPageData } from "@/lib/services/products-slug/get-product-page-data";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/products/[slug]/pdp
 * Warms Redis + Data Cache before client navigation (same payload as SSR).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = resolveStorefrontLocaleFromSearchParams(searchParams);
    const { slug } = await params;
    const result = await getProductPageData(slug, lang);
    if (result.status === "not_found") {
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

    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("GET product PDP bundle failed", { error: message });
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
