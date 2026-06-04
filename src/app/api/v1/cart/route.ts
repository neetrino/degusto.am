import { NextRequest, NextResponse } from "next/server";
import { problemTypes } from "@/lib/http/problem-details";
import { parseRouteCatchError } from "@/lib/http/api-route-errors";
import { cartService } from "@/lib/services/cart.service";
import { resolveCartRequestContext } from "@/lib/cart/cart-request-context";
import { logger } from "@/lib/utils/logger";

export async function GET(req: NextRequest) {
  try {
    const { user, locale, guestToken } = await resolveCartRequestContext(req);

    if (!user && !guestToken) {
      return NextResponse.json({ cart: null });
    }

    const result = await cartService.getCart(user?.id ?? null, locale, guestToken);
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
