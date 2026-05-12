import { NextRequest, NextResponse } from "next/server";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";
import { toApiError } from "@/lib/types/errors";
import { logger } from "@/lib/utils/logger";

/**
 * Force dynamic rendering for this route
 * Prevents Next.js from statically generating this route
 */
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/admin/analytics
 * Get analytics data for admin dashboard
 */
export async function GET(req: NextRequest) {
  try {
    logger.debug("📊 [ANALYTICS] Request received");
    const user = await authenticateToken(req);
    
    if (!user || !requireAdmin(user)) {
      logger.debug("❌ [ANALYTICS] Unauthorized or not admin");
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/forbidden",
          title: "Forbidden",
          status: 403,
          detail: "Admin access required",
          instance: req.url,
        },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "week";
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const allowedPeriods = new Set(["day", "week", "month", "year", "custom"]);
    if (!allowedPeriods.has(period)) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Parameter 'period' must be one of: day, week, month, year, custom",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    if (period === "custom" && (!startDate || !endDate)) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Parameters 'startDate' and 'endDate' are required for custom period",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    logger.debug(`✅ [ANALYTICS] User authenticated: ${user.id}, period: ${period}`);
    const result = await adminService.getAnalytics(period, startDate, endDate);
    logger.debug("✅ [ANALYTICS] Analytics data retrieved successfully");
    
    return NextResponse.json(result);
  } catch (error: unknown) {
    logger.error("Admin analytics GET failed", { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}

