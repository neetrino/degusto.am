import { NextRequest, NextResponse } from "next/server";
import { apiRouteCatchErrorResponse } from "@/lib/http/api-route-errors";
import { cartService } from "@/lib/services/cart.service";
import { resolveCartRequestContext } from "@/lib/cart/cart-request-context";
import {
  createGuestCartToken,
  setGuestCartTokenOnResponse,
} from "@/lib/cart/guest-cart-cookies";

export async function POST(req: NextRequest) {
  try {
    const { user, locale, guestToken } = await resolveCartRequestContext(req);
    const data = await req.json();

    const isNewGuestSession = !user && !guestToken;
    const activeGuestToken = user ? null : guestToken ?? createGuestCartToken();

    const result = await cartService.addItem(
      user?.id ?? null,
      data,
      locale,
      activeGuestToken
    );

    const response = NextResponse.json(result, { status: 201 });
    if (isNewGuestSession && activeGuestToken) {
      setGuestCartTokenOnResponse(response, activeGuestToken);
    }
    return response;
  } catch (error: unknown) {
    return apiRouteCatchErrorResponse(req, error, "[CART] POST add item");
  }
}
