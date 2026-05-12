import { NextRequest, NextResponse } from "next/server";
import { invalidateStorefrontCategoryCaches } from "@/lib/cache/storefront-cache";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";
import { toApiError } from "@/lib/types/errors";
import { logger } from "@/lib/utils/logger";

/**
 * GET /api/v1/admin/categories
 * Get list of categories
 */
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
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

    const result = await adminService.getCategories();
    return NextResponse.json(result);
  } catch (error: unknown) {
    logger.error("Admin categories GET failed", { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}

/**
 * POST /api/v1/admin/categories
 * Create a new category
 */
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
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

    const body = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Request body must be a valid JSON object",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    if (typeof body.title !== "string" || body.title.trim().length === 0) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Field 'title' is required and must be a non-empty string",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    logger.debug("📤 [ADMIN CATEGORIES] POST request:", body);

    const result = await adminService.createCategory(body);
    logger.debug("✅ [ADMIN CATEGORIES] Category created:", result.data.id);

    await invalidateStorefrontCategoryCaches();

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    logger.error("Admin categories POST failed", { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}

