import { NextRequest } from "next/server";
import { redirectToCheckoutSuccess } from "@/lib/payments/payment-route-utils";

/** GET /api/v1/payments/idram/success — user redirect after successful Idram payment. */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderNumber =
    searchParams.get("order")?.trim() ||
    searchParams.get("order_number")?.trim() ||
    searchParams.get("EDP_BILL_NO")?.trim() ||
    "";

  return redirectToCheckoutSuccess(orderNumber || "");
}
