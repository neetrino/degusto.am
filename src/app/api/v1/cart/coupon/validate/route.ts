import { NextRequest, NextResponse } from "next/server";
import { problemTypes } from "@/lib/http/problem-details";
import { ordersService } from "@/lib/services/orders.service";
import { toApiError } from "@/lib/types/errors";
import { logger } from "@/lib/utils/logger";

interface CouponValidationRequestBody {
  couponCode?: unknown;
  subtotal?: unknown;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CouponValidationRequestBody;
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          type: problemTypes.validationError,
          title: "Validation Error",
          status: 400,
          detail: "Request body must be a valid JSON object",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    if (typeof body.couponCode !== "string") {
      return NextResponse.json(
        {
          type: problemTypes.validationError,
          title: "Validation Error",
          status: 400,
          detail: "couponCode must be a string",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    const subtotal = Number(body.subtotal);
    const result = await ordersService.previewCouponDiscount(subtotal, body.couponCode);
    return NextResponse.json(result);
  } catch (error: unknown) {
    logger.error("Coupon validation failed", { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}
