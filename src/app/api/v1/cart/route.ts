import { NextRequest, NextResponse } from "next/server";
import { apiRouteCatchErrorResponse } from "@/lib/http/api-route-errors";
import { cartService } from "@/lib/services/cart.service";
import { resolveCartRequestContext } from "@/lib/cart/cart-request-context";
import { toCartApiStableResponse } from "@/lib/cart/cart-api-response";
import {
  createCartRequestSequenceId,
  logCartApiDiagnostic,
} from "@/lib/cart/cart-api-observability";

export async function GET(req: NextRequest) {
  const startedAt = Date.now();
  const requestSequenceId = createCartRequestSequenceId(req);
  let hasUser = false;
  let hasSession = false;
  let hasCartId = false;
  try {
    const { searchParams } = new URL(req.url);
    const summaryOnly =
      searchParams.get("summary") === "1" ||
      searchParams.get("summary") === "true";
    const { user, locale, guestToken } = await resolveCartRequestContext(req);
    hasUser = Boolean(user?.id);
    hasSession = Boolean(user?.id || guestToken);

    if (!user && !guestToken) {
      const response = NextResponse.json(toCartApiStableResponse(null));
      logCartApiDiagnostic({
        request: req,
        operation: "read",
        startedAt,
        status: response.status,
        hasCartId,
        hasUser,
        hasSession,
        requestSequenceId,
      });
      return response;
    }

    const result = summaryOnly
      ? await cartService.getCartSummary(user?.id ?? null, locale, guestToken)
      : await cartService.getCart(user?.id ?? null, locale, guestToken);
    const normalized = toCartApiStableResponse(result.cart);
    hasCartId = Boolean(normalized.cart.id);
    const response = NextResponse.json(normalized);
    logCartApiDiagnostic({
      request: req,
      operation: "read",
      startedAt,
      status: response.status,
      hasCartId,
      hasUser,
      hasSession,
      requestSequenceId,
    });
    return response;
  } catch (error: unknown) {
    const response = apiRouteCatchErrorResponse(req, error, "[CART] GET", {
      suppressLogging: true,
    });
    logCartApiDiagnostic({
      request: req,
      operation: "read",
      startedAt,
      status: response.status,
      hasCartId,
      hasUser,
      hasSession,
      requestSequenceId,
      error,
    });
    return response;
  }
}
