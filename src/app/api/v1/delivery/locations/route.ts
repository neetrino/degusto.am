import { NextRequest, NextResponse } from "next/server";
import { problemTypes } from "@/lib/http/problem-details";
import { parseRouteCatchError } from "@/lib/http/api-route-errors";
import { adminService } from "@/lib/services/admin.service";
import { logger } from "@/lib/utils/logger";

/**
 * GET /api/v1/delivery/locations
 * Get list of available delivery cities
 */
export async function GET(req: NextRequest) {
  try {
    logger.debug("Delivery locations request");
    const locations = await adminService.getPublicDeliveryLocations();
    return NextResponse.json(locations);
  } catch (error: unknown) {
    logger.error("Delivery locations error", error);
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
