import { NextRequest, NextResponse } from "next/server";
import { problemTypes } from "@/lib/http/problem-details";
import { apiRouteCatchErrorResponse } from "@/lib/http/api-route-errors";
import { cartService } from "@/lib/services/cart.service";
import { resolveCartRequestContext } from "@/lib/cart/cart-request-context";
import { logger } from "@/lib/utils/logger";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startedAt = Date.now();
  try {
    const { user, guestToken } = await resolveCartRequestContext(req);
    if (!user && !guestToken) {
      return NextResponse.json(
        {
          type: problemTypes.unauthorized,
          title: "Unauthorized",
          status: 401,
          detail: "Cart session required",
          instance: req.url,
        },
        { status: 401 }
      );
    }

    const { id } = await params;
    const data = await req.json();
    const result = await cartService.updateItem(
      user?.id ?? null,
      id,
      data.quantity,
      guestToken
    );
    logger.info("[CART] update item ok", {
      requestPath: req.nextUrl.pathname,
      method: req.method,
      responseStatus: 200,
      durationMs: Date.now() - startedAt,
      hasUser: Boolean(user?.id),
      hasGuestToken: Boolean(guestToken),
      cartItemId: id,
      quantity: result.item.quantity,
    });
    return NextResponse.json(result);
  } catch (error: unknown) {
    return apiRouteCatchErrorResponse(req, error, "[CART] PATCH item");
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startedAt = Date.now();
  try {
    const { user, guestToken } = await resolveCartRequestContext(req);
    if (!user && !guestToken) {
      return NextResponse.json(
        {
          type: problemTypes.unauthorized,
          title: "Unauthorized",
          status: 401,
          detail: "Cart session required",
          instance: req.url,
        },
        { status: 401 }
      );
    }

    const { id } = await params;
    await cartService.removeItem(user?.id ?? null, id, guestToken);
    logger.info("[CART] delete item ok", {
      requestPath: req.nextUrl.pathname,
      method: req.method,
      responseStatus: 204,
      durationMs: Date.now() - startedAt,
      hasUser: Boolean(user?.id),
      hasGuestToken: Boolean(guestToken),
      cartItemId: id,
    });
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    return apiRouteCatchErrorResponse(req, error, "[CART] DELETE item");
  }
}
