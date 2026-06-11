import { NextRequest, NextResponse } from "next/server";
import { problemTypes } from "@/lib/http/problem-details";
import { adminService } from "@/lib/services/admin.service";
import { logger } from "@/lib/utils/logger";
import { publicErrorDetailFromUnknown } from "@/lib/http/error-detail";

/**
 * GET /api/v1/delivery/price
 * Get delivery price for a specific city
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const city = searchParams.get('city');
    const country = searchParams.get('country')?.trim() || "Հայաստան";
    if (!city) {
      return NextResponse.json(
        {
          type: problemTypes.validationError,
          title: "Validation Error",
          status: 400,
          detail: "City parameter is required",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    logger.debug("Delivery price request", { city, country });
    const price = await adminService.getDeliveryPrice(city, country);
    if (price <= 0) {
      return NextResponse.json(
        {
          type: problemTypes.validationError,
          title: "Validation Error",
          status: 422,
          detail: "Delivery is unavailable for selected city",
          instance: req.url,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      price,
      city: city.trim(),
    });
  } catch (error: unknown) {
    const err = error as { message?: string; stack?: string; code?: string; type?: string; title?: string; status?: number; detail?: string; meta?: unknown };
    logger.error("Delivery price error", {
      message: err?.message,
      code: err?.code,
      type: err?.type,
      status: err?.status,
    });
    return NextResponse.json(
      {
        type: err?.type ?? problemTypes.internalError,
        title: err?.title ?? "Internal Server Error",
        status: err?.status ?? 500,
        detail: err?.detail ?? publicErrorDetailFromUnknown(error),
        instance: req.url,
      },
      { status: err?.status ?? 500 }
    );
  }
}

