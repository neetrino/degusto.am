import { NextRequest, NextResponse } from "next/server";
import { problemTypes } from "@/lib/http/problem-details";
import { invalidateStorefrontAfterAdminSettingsUpdate } from "@/lib/cache/storefront-cache";
import { parseRouteCatchError } from "@/lib/http/api-route-errors";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";
import { logger } from "@/lib/utils/logger";

export async function GET(req: NextRequest) {
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

    const result = await adminService.getSettings();
    return NextResponse.json(result);
  } catch (error: unknown) {
    logger.error("[ADMIN settings] GET Error", error);
    const e = parseRouteCatchError(error);
    return NextResponse.json(
      {
        type: e.type ?? problemTypes.internalError,
        title: e.title ?? "Internal Server Error",
        status: e.status ?? 500,
        detail: e.detail ?? e.message ?? "An error occurred",
        instance: req.url,
      },
      { status: e.status ?? 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
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

    const data = await req.json();
    const result = await adminService.updateSettings(data);
    await invalidateStorefrontAfterAdminSettingsUpdate();
    return NextResponse.json(result);
  } catch (error: unknown) {
    logger.error("[ADMIN settings] PUT Error", error);
    const e = parseRouteCatchError(error);
    return NextResponse.json(
      {
        type: e.type ?? problemTypes.internalError,
        title: e.title ?? "Internal Server Error",
        status: e.status ?? 500,
        detail: e.detail ?? e.message ?? "An error occurred",
        instance: req.url,
      },
      { status: e.status ?? 500 }
    );
  }
}

