import { NextRequest, NextResponse } from "next/server";
import { problemTypes } from "@/lib/http/problem-details";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";
import { safeParseAdminUserUpdate } from "@/lib/schemas/admin.schema";
import { toApiError } from "@/lib/types/errors";
import { logger } from "@/lib/utils/logger";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = safeParseAdminUserUpdate(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const detail =
        Object.entries(fieldErrors)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
          .join("; ") || parsed.error.message;
      return NextResponse.json(
        {
          type: problemTypes.validationError,
          title: "Validation Error",
          status: 400,
          detail,
          instance: req.url,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const result = await adminService.updateUser(id, data);
    return NextResponse.json(result);
  } catch (error: unknown) {
    logger.error("Admin user update failed", { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { status: 403 }
      );
    }

    const { id } = await params;
    await adminService.deleteUser(id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    logger.error("Admin user delete failed", { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}

