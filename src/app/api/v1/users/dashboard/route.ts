import { NextRequest, NextResponse } from "next/server";
import { problemTypes } from "@/lib/http/problem-details";
import { authenticateToken } from "@/lib/middleware/auth";
import {
  readUserDashboardCache,
  writeUserDashboardCache,
} from "@/lib/cache/user-dashboard-cache";
import { usersService } from "@/lib/services/users.service";
import { toApiError } from "@/lib/types/errors";
import { logger } from "@/lib/utils/logger";

/**
 * GET /api/v1/users/dashboard
 * Get user dashboard statistics and recent orders
 */
export async function GET(req: NextRequest) {
  try {
    logger.info("Dashboard request received");
    const user = await authenticateToken(req);
    
    if (!user) {
      logger.warn("Dashboard unauthorized");
      return NextResponse.json(
        {
          type: problemTypes.unauthorized,
          title: "Unauthorized",
          status: 401,
          detail: "Authentication token required",
          instance: req.url,
        },
        { status: 401 }
      );
    }

    logger.debug("User authenticated", { userId: user.id });
    const cached = await readUserDashboardCache<unknown>(user.id);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "X-Cache": "HIT" },
      });
    }

    const result = await usersService.getDashboard(user.id);
    await writeUserDashboardCache(user.id, result);
    logger.info("Dashboard data retrieved successfully");
    
    return NextResponse.json(result, {
      headers: { "X-Cache": "MISS" },
    });
  } catch (error: unknown) {
    logger.error("Dashboard error", { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}


