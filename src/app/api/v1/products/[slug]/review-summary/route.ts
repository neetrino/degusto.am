import { NextRequest, NextResponse } from "next/server";
import { problemTypes } from "@/lib/http/problem-details";
import { resolveStorefrontLocaleFromSearchParams } from "@/lib/i18n/locale";
import { getProductReviewSummary } from "@/lib/services/reviews/product-review-summary";
import { resolveProductIdBySlugCached } from "@/lib/services/products-slug/resolve-product-id-cached";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/products/[slug]/review-summary
 * Lightweight rating aggregate for PDP (off SSR critical path).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = resolveStorefrontLocaleFromSearchParams(searchParams);
    void lang;
    const { slug } = await params;
    const productId = await resolveProductIdBySlugCached(slug);
    if (!productId) {
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

    const summary = await getProductReviewSummary(productId);
    return NextResponse.json(summary);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("GET product review summary failed", { error: message });
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
