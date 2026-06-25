import { NextRequest } from "next/server";
import { handleArcaCallback } from "@/lib/payments/arca";
import { logger } from "@/lib/utils/logger";
import { redirectToCheckoutError } from "@/lib/payments/payment-route-utils";

/** GET /api/v1/payments/arca/callback — browser redirect after Arca payment. */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderNumber = searchParams.get("order")?.trim() ?? "";
  const arcaOrderId = searchParams.get("orderId")?.trim() ?? searchParams.get("mdOrder")?.trim();

  if (!orderNumber) {
    logger.warn("Arca callback missing order query param");
    return redirectToCheckoutError("");
  }

  return handleArcaCallback({ orderNumber, arcaOrderId });
}
