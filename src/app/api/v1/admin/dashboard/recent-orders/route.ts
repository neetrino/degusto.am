import { NextRequest, NextResponse } from "next/server";
import { parseRouteCatchError } from "@/lib/http/api-route-errors";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";
import { logger } from "@/lib/utils/logger";

/**
 * GET /api/v1/admin/dashboard/recent-orders
 * Get recent orders for admin dashboard
 */
export async function GET(req: NextRequest) {
  try {
    logger.debug("📋 [RECENT-ORDERS] Request received");
    const user = await authenticateToken(req);
    
    if (!user || !requireAdmin(user)) {
      logger.debug("❌ [RECENT-ORDERS] Unauthorized or not admin");
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

    // Get limit from query params
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "5", 10);

    logger.debug(`✅ [RECENT-ORDERS] User authenticated: ${user.id}, limit: ${limit}`);
    const result = await adminService.getRecentOrders(limit);
    logger.debug("✅ [RECENT-ORDERS] Recent orders retrieved successfully");
    
    return NextResponse.json({ data: result });
  } catch (error: unknown) {
    logger.error("[RECENT-ORDERS] Error", error);
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


