import { NextRequest, NextResponse } from "next/server";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";
import { toApiError } from "@/lib/types/errors";
import { logger } from "@/lib/utils/logger";

/**
 * PATCH /api/v1/admin/attributes/[id]/values/[valueId]
 * Update an attribute value
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; valueId: string }> }
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

    const { id: attributeId, valueId } = await params;
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

    logger.debug('✏️ [ADMIN ATTRIBUTE VALUES] PATCH request:', { attributeId, valueId, body });

    if (
      body.label !== undefined &&
      (typeof body.label !== "string" || body.label.trim().length === 0)
    ) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Field 'label' must be a non-empty string when provided",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    if (
      body.priceAdjustment !== undefined &&
      (typeof body.priceAdjustment !== "number" || !Number.isFinite(body.priceAdjustment))
    ) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Field 'priceAdjustment' must be a finite number when provided",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    const result = await adminService.updateAttributeValue(attributeId, valueId, {
      label: body.label,
      colors: body.colors,
      imageUrl: body.imageUrl,
      priceAdjustment: body.priceAdjustment,
      locale: body.locale || "en",
    });

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error: unknown) {
    logger.error("Admin attribute values PATCH failed", { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}

/**
 * DELETE /api/v1/admin/attributes/[id]/values/[valueId]
 * Delete an attribute value
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; valueId: string }> }
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

    const { valueId } = await params;
    const result = await adminService.deleteAttributeValue(valueId);
    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error: unknown) {
    logger.error("Admin attribute values DELETE failed", { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}

