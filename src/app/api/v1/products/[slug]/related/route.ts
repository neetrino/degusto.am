import { NextRequest, NextResponse } from "next/server";
import { problemTypes } from "@/lib/http/problem-details";
import { resolveStorefrontLocaleFromSearchParams } from "@/lib/i18n/locale";
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
    const batched = await getRelatedProductsBatchForPdp(
      slug,
      lang,
      safeOffset,
      safeLimit
    );
    return NextResponse.json({ data: batched.data, meta: { total: batched.total } });
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
