import { NextRequest, NextResponse } from "next/server";
import { apiRouteCatchErrorResponse } from "@/lib/http/api-route-errors";
import { cartService } from "@/lib/services/cart.service";
import { resolveCartRequestContext } from "@/lib/cart/cart-request-context";

export async function GET(req: NextRequest) {
  try {
    const { user, locale, guestToken } = await resolveCartRequestContext(req);

    if (!user && !guestToken) {
      return NextResponse.json({ cart: null });
    }

    const result = await cartService.getCart(user?.id ?? null, locale, guestToken);
    return NextResponse.json(result);
  } catch (error: unknown) {
    return apiRouteCatchErrorResponse(req, error, "[CART] GET");
  }
}
