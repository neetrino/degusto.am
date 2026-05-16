import { NextRequest, NextResponse } from "next/server";
import { problemTypes } from "@/lib/http/problem-details";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";
import { toApiError } from "@/lib/types/errors";
import { logger } from "@/lib/utils/logger";

function forbiddenResponse(url: string) {
  return NextResponse.json(
    {
      type: problemTypes.forbidden,
      title: "Forbidden",
      status: 403,
      detail: "Admin access required",
      instance: url,
    },
    { status: 403 }
  );
}

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      return forbiddenResponse(req.url);
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "week";
    const couponCode = searchParams.get("couponCode");
    const result = await adminService.getCouponsAnalytics(period, couponCode);
    return NextResponse.json(result);
  } catch (error: unknown) {
    logger.error("Admin coupon analytics failed", { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}
