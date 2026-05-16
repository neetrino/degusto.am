import { NextRequest, NextResponse } from "next/server";
import { problemTypes } from "@/lib/http/problem-details";
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
 * GET /api/v1/admin/stats
 * Get admin statistics (users count, etc.)
 */
export async function GET(req: NextRequest) {
  try {
    logger.debug("📊 [ADMIN STATS] Request received:", { url: req.url });
    const user = await authenticateToken(req);
    
    if (!user || !requireAdmin(user)) {
      logger.debug("❌ [ADMIN STATS] Unauthorized or not admin");
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

    logger.debug(`✅ [ADMIN STATS] User authenticated: ${user.id}`);
    const result = await adminService.getStats();
    logger.debug("✅ [ADMIN STATS] Stats data retrieved successfully");
    
    return NextResponse.json(result);
  } catch (error: unknown) {
    logger.error("Admin stats GET failed", { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}

