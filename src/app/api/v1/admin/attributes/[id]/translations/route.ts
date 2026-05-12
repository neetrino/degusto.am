import { NextRequest, NextResponse } from "next/server";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";
import { toApiError } from "@/lib/types/errors";
import { logger } from "@/lib/utils/logger";

/**
 * PATCH /api/v1/admin/attributes/[id]/translations
 * Update attribute translation (name)
 */
export async function PATCH(
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

    const { id: attributeId } = await params;
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

    if (typeof body.name !== "string" || body.name.trim().length === 0) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Field 'name' is required and must be a non-empty string",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    logger.debug('✏️ [ADMIN ATTRIBUTE TRANSLATIONS] PATCH request:', { attributeId, body });

    const result = await adminService.updateAttributeTranslation(attributeId, {
      name: body.name,
      locale: body.locale || "en",
    });

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error: unknown) {
    logger.error("Admin attribute translations PATCH failed", { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}




