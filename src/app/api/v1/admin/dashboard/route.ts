import { NextRequest, NextResponse } from "next/server";
import { problemTypes } from "@/lib/http/problem-details";
import { parseRouteCatchError } from "@/lib/http/api-route-errors";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";
import {
  ADMIN_DASHBOARD_RECENT_ORDERS_LIMIT,
  ADMIN_DASHBOARD_TOP_PRODUCTS_LIMIT,
} from "@/lib/services/admin/admin-stats/dashboard";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/admin/dashboard
 * Combined admin dashboard payload (stats, recent orders, top products).
 */
export async function GET(req: NextRequest) {
  try {
    logger.debug("📊 [ADMIN DASHBOARD] Request received");
    const user = await authenticateToken(req);

    if (!user || !requireAdmin(user)) {
      logger.debug("❌ [ADMIN DASHBOARD] Unauthorized or not admin");
      return NextResponse.json(
        {
          type: problemTypes.forbidden,
          title: "Forbidden",
          status: 403,
          detail: "Admin access required",
          instance: req.url,
        },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const recentOrdersLimit = parseInt(
      searchParams.get("recentOrdersLimit") || String(ADMIN_DASHBOARD_RECENT_ORDERS_LIMIT),
      10,
    );
    const topProductsLimit = parseInt(
      searchParams.get("topProductsLimit") || String(ADMIN_DASHBOARD_TOP_PRODUCTS_LIMIT),
      10,
    );

    logger.debug(`✅ [ADMIN DASHBOARD] User authenticated: ${user.id}`);
    const result = await adminService.getDashboard({
      recentOrdersLimit,
      topProductsLimit,
    });
    logger.debug("✅ [ADMIN DASHBOARD] Payload retrieved successfully");

    return NextResponse.json({ data: result });
  } catch (error: unknown) {
    logger.error("[ADMIN DASHBOARD] Error", error);
    const e = parseRouteCatchError(error);
    return NextResponse.json(
      {
        type: e.type ?? problemTypes.internalError,
        title: e.title ?? "Internal Server Error",
        status: e.status ?? 500,
        detail: e.detail ?? e.message ?? "An error occurred",
        instance: req.url,
      },
      { status: e.status ?? 500 },
    );
  }
}
