import { NextRequest, NextResponse } from "next/server";
import { problemTypes } from "@/lib/http/problem-details";
import { resolveStorefrontLocaleFromSearchParams } from "@/lib/i18n/locale";
import { findQuickAddBySlug } from "@/lib/services/products-slug/product-quick-add.service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/products/[slug]/quick-add
 * Minimal variant availability payload for storefront quick add-to-cart.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = resolveStorefrontLocaleFromSearchParams(searchParams);
    const { slug } = await params;
    const body = await findQuickAddBySlug(slug, lang);

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

    return NextResponse.json(body);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("GET product quick-add failed", { error: message });
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
