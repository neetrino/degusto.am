import { NextRequest, NextResponse } from "next/server";
import { problemTypes } from "@/lib/http/problem-details";
import { parseRouteCatchError } from "@/lib/http/api-route-errors";
import { authenticateToken } from "@/lib/middleware/auth";
import { ordersService } from "@/lib/services/orders.service";
import { logger } from "@/lib/utils/logger";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
  let user: { id: string } | null = null;
  try {
    user = await authenticateToken(req);
    if (!user) {
      return NextResponse.json(
        {
          type: problemTypes.unauthorized,
          title: "Unauthorized",
          status: 401,
          detail: "Authentication token required",
          instance: req.url,
        },
        { status: 401 }
      );
    }

    const { number } = await params;
    const result = await ordersService.findByNumber(number, user.id);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const { number } = await params;
    logger.error("[ORDERS] Get order by number error", {
      orderNumber: number,
      userId: user?.id,
      error,
    });
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

