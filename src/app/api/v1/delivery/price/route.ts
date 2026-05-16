import { NextRequest, NextResponse } from "next/server";
import { problemTypes } from "@/lib/http/problem-details";
import { resolveFixedDeliveryFees } from "@/lib/delivery-rules";
import { logger } from "@/lib/utils/logger";

/**
 * GET /api/v1/delivery/price
 * Get delivery price for a specific city
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const city = searchParams.get('city');
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

    logger.debug("Delivery price request", { city });
    const fixed = resolveFixedDeliveryFees('delivery', city);
    if (!fixed.isAllowed) {
      return NextResponse.json(
        {
          type: problemTypes.validationError,
          title: "Validation Error",
          status: 422,
          detail: "Delivery is available only in Yerevan",
          instance: req.url,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      price: fixed.deliveryPriceAmd,
      bagFee: fixed.bagFeeAmd,
      totalShipping: fixed.totalShippingAmd,
      city: fixed.normalizedCity,
      fixedRule: true,
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
        detail: err?.detail ?? err?.message ?? "An error occurred",
        instance: req.url,
      },
      { status: err?.status ?? 500 }
    );
  }
}

