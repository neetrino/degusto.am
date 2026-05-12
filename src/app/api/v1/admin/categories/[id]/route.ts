import { NextRequest, NextResponse } from "next/server";
import { invalidateStorefrontCategoryCaches } from "@/lib/cache/storefront-cache";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";
import { toApiError } from "@/lib/types/errors";
import { logger } from "@/lib/utils/logger";

/**
 * GET /api/v1/admin/categories/[id]
 * Get a single category by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const category = await adminService.getCategoryById(id);

    if (!category) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/not-found",
          title: "Category not found",
          status: 404,
          detail: `Category with id '${id}' does not exist`,
          instance: req.url,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: category });
  } catch (error: unknown) {
    logger.error("Admin categories [id] GET failed", { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}

/**
 * PUT /api/v1/admin/categories/[id]
 * Update a category
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
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

    if (body.title !== undefined && (typeof body.title !== "string" || body.title.trim().length === 0)) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Field 'title' must be a non-empty string when provided",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    logger.debug("📝 [ADMIN CATEGORIES] PUT request:", { id, body });

    const result = await adminService.updateCategory(id, body);
    logger.debug("✅ [ADMIN CATEGORIES] Category updated:", id);

    await invalidateStorefrontCategoryCaches();

    return NextResponse.json(result);
  } catch (error: unknown) {
    logger.error("Admin categories [id] PUT failed", { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}

/**
 * DELETE /api/v1/admin/categories/[id]
 * Delete a category (soft delete)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    logger.debug("🗑️ [ADMIN CATEGORIES] DELETE request:", id);

    await adminService.deleteCategory(id);
    logger.debug("✅ [ADMIN CATEGORIES] Category deleted:", id);

    await invalidateStorefrontCategoryCaches();

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    logger.error("Admin categories [id] DELETE failed", { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}

