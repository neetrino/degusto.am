import { NextRequest, NextResponse } from "next/server";
import { apiRouteCatchErrorResponse } from "@/lib/http/api-route-errors";
import { createProblem } from "@/lib/http/problem-details";
import { problemJson } from "@/lib/http/problem-response";
import { cartService } from "@/lib/services/cart.service";
import { resolveCartRequestContext } from "@/lib/cart/cart-request-context";
import {
  createGuestCartToken,
  setGuestCartTokenOnResponse,
} from "@/lib/cart/guest-cart-cookies";
import { toCartApiStableResponse } from "@/lib/cart/cart-api-response";
import { safeParseCartItemRequest } from "@/lib/schemas/cart.schema";
import { enforceRouteRateLimit } from "@/lib/http/route-rate-limit";
import { logger } from "@/lib/utils/logger";

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  try {
    const rateLimited = await enforceRouteRateLimit(req, {
      prefix: "ratelimit:cart-items",
      limit: 30,
      window: "60 s",
      detail: "Too many cart item requests. Try again later.",
    });
    if (rateLimited) {
      return rateLimited;
    }

    const { user, locale, guestToken } = await resolveCartRequestContext(req);
    const body = await req.json();
    const parsed = safeParseCartItemRequest(body);
    if (!parsed.success) {
      return problemJson(
        createProblem("validationError", {
          status: 400,
          title: "Validation Error",
          detail: parsed.error.issues[0]?.message ?? "Invalid cart item payload",
          instance: req.url,
        })
      );
    }
    const data = parsed.data;

    const isNewGuestSession = !user && !guestToken;
    const activeGuestToken = user ? null : guestToken ?? createGuestCartToken();

    await cartService.addItem(
      user?.id ?? null,
      data,
      locale,
      activeGuestToken
    );
    const updatedCart = await cartService.getCart(
      user?.id ?? null,
      locale,
      activeGuestToken
    );
    const normalized = toCartApiStableResponse(updatedCart.cart);

    logger.info("[CART] add item ok", {
      requestPath: req.nextUrl.pathname,
      method: req.method,
      responseStatus: 200,
      durationMs: Date.now() - startedAt,
      hasUser: Boolean(user?.id),
      hasGuestToken: Boolean(activeGuestToken),
      cartId: normalized.cart.id || null,
      itemsCount: normalized.cart.items.reduce((sum, item) => sum + item.quantity, 0),
    });

    const response = NextResponse.json(normalized, { status: 200 });
    if (isNewGuestSession && activeGuestToken) {
      setGuestCartTokenOnResponse(response, activeGuestToken);
    }
    return response;
  } catch (error: unknown) {
    return apiRouteCatchErrorResponse(req, error, "[CART] POST add item");
  }
}
