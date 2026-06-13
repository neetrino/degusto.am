import { NextRequest, NextResponse } from "next/server";
import { apiRouteCatchErrorResponse } from "@/lib/http/api-route-errors";
import { cartService } from "@/lib/services/cart.service";
import { resolveCartRequestContext } from "@/lib/cart/cart-request-context";

export async function GET(req: NextRequest) {
  const startedAt = Date.now();
  try {
    const { searchParams } = new URL(req.url);
    const summaryOnly =
      searchParams.get("summary") === "1" ||
      searchParams.get("summary") === "true";
    const { user, locale, guestToken } = await resolveCartRequestContext(req);

    if (!user && !guestToken) {
      return NextResponse.json({ cart: null });
    }

    const result = summaryOnly
      ? await cartService.getCartSummary(user?.id ?? null, locale, guestToken)
      : await cartService.getCart(user?.id ?? null, locale, guestToken);
    const durationMs = Date.now() - startedAt;
    const itemsCount = Array.isArray(result.cart?.items) ? result.cart.items.length : 0;
    console.debug("[perf] GET /api/v1/cart", {
      durationMs,
      hasUser: Boolean(user?.id),
      hasGuestToken: Boolean(guestToken),
      itemsCount,
      summaryOnly,
    });
    return NextResponse.json(result);
  } catch (error: unknown) {
    return apiRouteCatchErrorResponse(req, error, "[CART] GET");
  }
}
