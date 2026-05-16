import { NextRequest, NextResponse } from "next/server";
import { problemTypes } from "@/lib/http/problem-details";
import { parseRouteCatchError } from "@/lib/http/api-route-errors";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";
import { logger } from "@/lib/utils/logger";

/**
 * GET /api/v1/admin/dashboard/user-activity
 * Get user activity statistics (recent registrations and active users)
 */
export async function GET(req: NextRequest) {
  try {
    logger.debug("👥 [USER-ACTIVITY] Request received");
    const user = await authenticateToken(req);
    
    if (!user || !requireAdmin(user)) {
      logger.debug("❌ [USER-ACTIVITY] Unauthorized or not admin");
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

    // Get limit from query params
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    logger.debug(`✅ [USER-ACTIVITY] User authenticated: ${user.id}, limit: ${limit}`);
    const result = await adminService.getUserActivity(limit);
    logger.debug("✅ [USER-ACTIVITY] User activity data retrieved successfully");
    
    return NextResponse.json({ data: result });
  } catch (error: unknown) {
    logger.error("[USER-ACTIVITY] Error", error);
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


