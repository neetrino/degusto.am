import { NextRequest, NextResponse } from "next/server";
import { problemTypes } from "@/lib/http/problem-details";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";
import { toApiError } from "@/lib/types/errors";
import { logger } from "@/lib/utils/logger";

/**
 * PATCH /api/v1/admin/categories/reorder
 * Reorder sibling categories under the same parent.
 */
export async function PATCH(req: NextRequest) {
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
        { status: 403 },
      );
    }

    const body = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          type: problemTypes.validationError,
          title: "Validation Error",
          status: 400,
          detail: "Request body must be a valid JSON object",
          instance: req.url,
        },
        { status: 400 },
      );
    }

    const parentId =
      body.parentId === null || body.parentId === undefined
        ? null
        : typeof body.parentId === "string"
          ? body.parentId
          : undefined;

    if (parentId === undefined) {
      return NextResponse.json(
        {
          type: problemTypes.validationError,
          title: "Validation Error",
          status: 400,
          detail: "Field 'parentId' must be a string or null",
          instance: req.url,
        },
        { status: 400 },
      );
    }

    if (!Array.isArray(body.orderedIds) || body.orderedIds.length === 0) {
      return NextResponse.json(
        {
          type: problemTypes.validationError,
          title: "Validation Error",
          status: 400,
          detail: "Field 'orderedIds' must be a non-empty array of category IDs",
          instance: req.url,
        },
        { status: 400 },
      );
    }

    if (!body.orderedIds.every((id: unknown) => typeof id === "string" && id.length > 0)) {
      return NextResponse.json(
        {
          type: problemTypes.validationError,
          title: "Validation Error",
          status: 400,
          detail: "Each entry in 'orderedIds' must be a non-empty string",
          instance: req.url,
        },
        { status: 400 },
      );
    }

    logger.debug("Admin categories reorder request", { parentId, orderedIds: body.orderedIds });

    const result = await adminService.reorderCategories({
      parentId,
      orderedIds: body.orderedIds as string[],
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    logger.error("Admin categories reorder failed", { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}
