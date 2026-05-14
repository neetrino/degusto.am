import { NextRequest, NextResponse } from "next/server";
import { parseRouteCatchError } from "@/lib/http/api-route-errors";
import { db } from "@white-shop/db";
import { logger } from "@/lib/utils/logger";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const variant = await db.productVariant.findUnique({
      where: { id },
      select: {
        id: true,
        productId: true,
        stock: true,
        published: true,
      },
    });

    if (!variant) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/not-found",
          title: "Variant not found",
          status: 404,
          detail: `Variant with id '${id}' not found`,
          instance: req.url,
        },
        { status: 404 }
      );
    }

    // Calculate available based on stock > 0 and published === true
    const available = variant.stock > 0 && variant.published === true;

    return NextResponse.json({
      id: variant.id,
      productId: variant.productId,
      stock: variant.stock,
      available: available,
    });
  } catch (error: unknown) {
    logger.error("[PRODUCTS] Get variant error", error);
    const e = parseRouteCatchError(error);
    return NextResponse.json(
      {
        type: e.type ?? "https://api.shop.am/problems/internal-error",
        title: e.title ?? "Internal Server Error",
        status: e.status ?? 500,
        detail: e.detail ?? e.message ?? "An error occurred",
        instance: req.url,
      },
      { status: e.status ?? 500 }
    );
  }
}

