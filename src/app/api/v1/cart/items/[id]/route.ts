import { NextRequest, NextResponse } from "next/server";
import { problemTypes } from "@/lib/http/problem-details";
import { parseRouteCatchError } from "@/lib/http/api-route-errors";
import { authenticateToken } from "@/lib/middleware/auth";
import { cartService } from "@/lib/services/cart.service";
import { logger } from "@/lib/utils/logger";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateToken(req);
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

    const { id } = await params;
    const data = await req.json();
    const result = await cartService.updateItem(user.id, id, data.quantity);
    return NextResponse.json(result);
  } catch (error: unknown) {
    logger.error("[CART] Error", error);
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateToken(req);
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

    const { id } = await params;
    await cartService.removeItem(user.id, id);
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    logger.error("[CART] Error", error);
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

