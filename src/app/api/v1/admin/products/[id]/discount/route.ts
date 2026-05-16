import { NextRequest, NextResponse } from "next/server";
import { problemTypes } from "@/lib/http/problem-details";
import { parseRouteCatchError } from "@/lib/http/api-route-errors";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";
import { logger } from "@/lib/utils/logger";

/**
 * PATCH /api/v1/admin/products/[id]/discount
 * Update product discount percentage
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      return NextResponse.json(
        {
          type: problemTypes.forbidden,
          title: "Forbidden",
          status: 403,
          detail: "Admin access required",
          instance: req.url,
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const discountPercent = body.discountPercent;

    logger.debug("💰 [ADMIN PRODUCTS] PATCH discount request:", { 
      id, 
      body, 
      discountPercent, 
      type: typeof discountPercent 
    });

    if (typeof discountPercent !== "number" || discountPercent < 0 || discountPercent > 100) {
      logger.warn("[ADMIN PRODUCTS] Invalid discountPercent", { discountPercent });
      return NextResponse.json(
        {
          type: problemTypes.validationError,
          title: "Validation Error",
          status: 400,
          detail: "discountPercent must be a number between 0 and 100",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    logger.debug("💰 [ADMIN PRODUCTS] Calling updateProductDiscount:", { id, discountPercent });

    const result = await adminService.updateProductDiscount(id, discountPercent);
    logger.debug("✅ [ADMIN PRODUCTS] Product discount updated:", { id, result });

    return NextResponse.json({ success: true, discountPercent: result.discountPercent });
  } catch (error: unknown) {
    logger.error("[ADMIN PRODUCTS] PATCH discount Error", error);
    const e = parseRouteCatchError(error);
    return NextResponse.json(
      {
        type: e.type ?? problemTypes.internalError,
        title: e.title ?? "Internal Server Error",
        status: e.status ?? 500,
        detail: e.detail ?? e.message ?? "An error occurred",
        instance: req.url,
      },
      { status: e.status ?? 500 }
    );
  }
}

