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
import {
  createCartRequestSequenceId,
  logCartApiDiagnostic,
} from "@/lib/cart/cart-api-observability";

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  const requestSequenceId = createCartRequestSequenceId(req);
  let hasUser = false;
  let hasSession = false;
  let hasCartId = false;
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
    hasUser = Boolean(user?.id);
    hasSession = Boolean(user?.id || guestToken);
    const body = await req.json();
    const parsed = safeParseCartItemRequest(body);
    if (!parsed.success) {
      const response = problemJson(
        createProblem("validationError", {
          status: 400,
          title: "Validation Error",
          detail: parsed.error.issues[0]?.message ?? "Invalid cart item payload",
          instance: req.url,
        })
      );
      logCartApiDiagnostic({
        request: req,
        operation: "add",
        startedAt,
        status: response.status,
        hasCartId,
        hasUser,
        hasSession,
        requestSequenceId,
        error: parsed.error,
      });
      return response;
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
    hasCartId = Boolean(normalized.cart.id);
    hasSession = Boolean(user?.id || activeGuestToken);

    const response = NextResponse.json(normalized, { status: 200 });
    if (isNewGuestSession && activeGuestToken) {
      setGuestCartTokenOnResponse(response, activeGuestToken);
    }
    logCartApiDiagnostic({
      request: req,
      operation: "add",
      startedAt,
      status: response.status,
      hasCartId,
      hasUser,
      hasSession,
      requestSequenceId,
    });
    return response;
  } catch (error: unknown) {
    const response = apiRouteCatchErrorResponse(req, error, "[CART] POST add item", {
      suppressLogging: true,
    });
    logCartApiDiagnostic({
      request: req,
      operation: "add",
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
