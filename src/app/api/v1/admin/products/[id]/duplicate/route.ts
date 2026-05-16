import { NextRequest, NextResponse } from "next/server";
import { problemTypes } from "@/lib/http/problem-details";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";
import { toApiError } from "@/lib/types/errors";
import { logger } from "@/lib/utils/logger";

/**
 * POST /api/v1/admin/products/[id]/duplicate
 * Creates a draft copy with zero price and zero stock on all variants.
 */
export async function POST(
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
    const result = await adminService.duplicateProductAsDraft(id);
    return NextResponse.json(result);
  } catch (error: unknown) {
    logger.error("[ADMIN PRODUCTS] POST duplicate error", {
      message: error instanceof Error ? error.message : String(error),
    });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}
