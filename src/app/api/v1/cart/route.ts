import { NextRequest, NextResponse } from "next/server";
import { apiRouteCatchErrorResponse } from "@/lib/http/api-route-errors";
import { cartService } from "@/lib/services/cart.service";
import { resolveCartRequestContext } from "@/lib/cart/cart-request-context";
import { toCartApiStableResponse } from "@/lib/cart/cart-api-response";
import { logger } from "@/lib/utils/logger";

export async function GET(req: NextRequest) {
  const startedAt = Date.now();
  try {
    const { searchParams } = new URL(req.url);
    const summaryOnly =
      searchParams.get("summary") === "1" ||
      searchParams.get("summary") === "true";
    const { user, locale, guestToken } = await resolveCartRequestContext(req);

    if (!user && !guestToken) {
      return NextResponse.json(toCartApiStableResponse(null));
    }

    const result = summaryOnly
      ? await cartService.getCartSummary(user?.id ?? null, locale, guestToken)
      : await cartService.getCart(user?.id ?? null, locale, guestToken);
    const durationMs = Date.now() - startedAt;
    const normalized = toCartApiStableResponse(result.cart);
    const itemsCount = normalized.cart.items.length;
    logger.info("[CART] read ok", {
      requestPath: req.nextUrl.pathname,
      method: req.method,
      durationMs,
      responseStatus: 200,
      hasUser: Boolean(user?.id),
      hasGuestToken: Boolean(guestToken),
      cartId: normalized.cart.id || null,
      itemsCount,
      summaryOnly,
    });
    return NextResponse.json(normalized);
  } catch (error: unknown) {
    return apiRouteCatchErrorResponse(req, error, "[CART] GET");
  }
}
