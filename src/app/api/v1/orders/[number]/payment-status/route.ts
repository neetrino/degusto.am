import { NextRequest, NextResponse } from "next/server";
import { db } from "@white-shop/db";
import { createProblem } from "@/lib/http/problem-details";
import { problemJson } from "@/lib/http/problem-response";

/** GET /api/v1/orders/[number]/payment-status — public payment status for checkout success page. */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
  const { number } = await params;
  const orderNumber = number.trim();

  if (!orderNumber) {
    return problemJson(
      createProblem("validationError", {
        status: 400,
        title: "Validation Error",
        detail: "Order number is required",
        instance: req.url,
      })
    );
  }

  const order = await db.order.findUnique({
    where: { number: orderNumber },
    select: { number: true, paymentStatus: true },
  });

  if (!order) {
    return problemJson(
      createProblem("notFound", {
        status: 404,
        title: "Not Found",
        detail: "Order not found",
        instance: req.url,
      })
    );
  }

  return NextResponse.json({
    orderNumber: order.number,
    paymentStatus: order.paymentStatus,
  });
}
