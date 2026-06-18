import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createProblem, problemTypes } from "@/lib/http/problem-details";
import { apiRouteCatchErrorResponse } from "@/lib/http/api-route-errors";
import { problemJson } from "@/lib/http/problem-response";
import { cartService } from "@/lib/services/cart.service";
import { resolveCartRequestContext } from "@/lib/cart/cart-request-context";
import { toCartApiStableResponse } from "@/lib/cart/cart-api-response";
import {
  createCartRequestSequenceId,
  logCartApiDiagnostic,
} from "@/lib/cart/cart-api-observability";

const cartItemIdSchema = z
  .string()
  .trim()
  .regex(/^[a-zA-Z0-9_-]{8,64}$/, "Invalid cart item id");

const updateCartItemQuantitySchema = z.object({
  quantity: z.number().int().min(1).max(999),
});

async function updateQuantity(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startedAt = Date.now();
  const requestSequenceId = createCartRequestSequenceId(req);
  let hasUser = false;
  let hasSession = false;
  let hasCartId = false;
  try {
    const { user, guestToken, locale } = await resolveCartRequestContext(req);
    hasUser = Boolean(user?.id);
    hasSession = Boolean(user?.id || guestToken);
    if (!user && !guestToken) {
      const response = NextResponse.json(
        {
          type: problemTypes.unauthorized,
          title: "Unauthorized",
          status: 401,
          detail: "Cart session required",
          instance: req.url,
        },
        { status: 401 }
      );
      logCartApiDiagnostic({
        request: req,
        operation: "update",
        startedAt,
        status: response.status,
        hasCartId,
        hasUser,
        hasSession,
        requestSequenceId,
        error: { name: "SessionError", message: "Cart session required" },
      });
      return response;
    }

    const { id } = await params;
    const idParsed = cartItemIdSchema.safeParse(id);
    if (!idParsed.success) {
      const response = problemJson(
        createProblem("badRequest", {
          status: 400,
          title: "Bad Request",
          detail: idParsed.error.issues[0]?.message ?? "Invalid cart item id",
          instance: req.url,
        })
      );
      logCartApiDiagnostic({
        request: req,
        operation: "update",
        startedAt,
        status: response.status,
        hasCartId,
        hasUser,
        hasSession,
        requestSequenceId,
        error: idParsed.error,
      });
      return response;
    }

    const dataParsed = updateCartItemQuantitySchema.safeParse(await req.json());
    if (!dataParsed.success) {
      const response = problemJson(
        createProblem("validationError", {
          status: 400,
          title: "Validation Error",
          detail: dataParsed.error.issues[0]?.message ?? "Invalid quantity",
          instance: req.url,
        })
      );
      logCartApiDiagnostic({
        request: req,
        operation: "update",
        startedAt,
        status: response.status,
        hasCartId,
        hasUser,
        hasSession,
        requestSequenceId,
        error: dataParsed.error,
      });
      return response;
    }

    await cartService.updateItem(
      user?.id ?? null,
      idParsed.data,
      dataParsed.data.quantity,
      guestToken
    );
    const updatedCart = await cartService.getCart(user?.id ?? null, locale, guestToken);
    const normalized = toCartApiStableResponse(updatedCart.cart);
    hasCartId = Boolean(normalized.cart.id);
    const response = NextResponse.json(normalized, { status: 200 });
    logCartApiDiagnostic({
      request: req,
      operation: "update",
      startedAt,
      status: response.status,
      hasCartId,
      hasUser,
      hasSession,
      requestSequenceId,
    });
    return response;
  } catch (error: unknown) {
    const response = apiRouteCatchErrorResponse(req, error, "[CART] UPDATE item", {
      suppressLogging: true,
    });
    logCartApiDiagnostic({
      request: req,
      operation: "update",
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

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return updateQuantity(req, context);
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return updateQuantity(req, context);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startedAt = Date.now();
  const requestSequenceId = createCartRequestSequenceId(req);
  let hasUser = false;
  let hasSession = false;
  let hasCartId = false;
  try {
    const { user, guestToken, locale } = await resolveCartRequestContext(req);
    hasUser = Boolean(user?.id);
    hasSession = Boolean(user?.id || guestToken);
    if (!user && !guestToken) {
      const response = NextResponse.json(
        {
          type: problemTypes.unauthorized,
          title: "Unauthorized",
          status: 401,
          detail: "Cart session required",
          instance: req.url,
        },
        { status: 401 }
      );
      logCartApiDiagnostic({
        request: req,
        operation: "delete",
        startedAt,
        status: response.status,
        hasCartId,
        hasUser,
        hasSession,
        requestSequenceId,
        error: { name: "SessionError", message: "Cart session required" },
      });
      return response;
    }

    const { id } = await params;
    const idParsed = cartItemIdSchema.safeParse(id);
    if (!idParsed.success) {
      const response = problemJson(
        createProblem("badRequest", {
          status: 400,
          title: "Bad Request",
          detail: idParsed.error.issues[0]?.message ?? "Invalid cart item id",
          instance: req.url,
        })
      );
      logCartApiDiagnostic({
        request: req,
        operation: "delete",
        startedAt,
        status: response.status,
        hasCartId,
        hasUser,
        hasSession,
        requestSequenceId,
        error: idParsed.error,
      });
      return response;
    }

    await cartService.removeItem(user?.id ?? null, idParsed.data, guestToken);
    const updatedCart = await cartService.getCart(user?.id ?? null, locale, guestToken);
    const normalized = toCartApiStableResponse(updatedCart.cart);
    hasCartId = Boolean(normalized.cart.id);
    const response = NextResponse.json(normalized, { status: 200 });
    logCartApiDiagnostic({
      request: req,
      operation: "delete",
      startedAt,
      status: response.status,
      hasCartId,
      hasUser,
      hasSession,
      requestSequenceId,
    });
    return response;
  } catch (error: unknown) {
    const response = apiRouteCatchErrorResponse(req, error, "[CART] DELETE item", {
      suppressLogging: true,
    });
    logCartApiDiagnostic({
      request: req,
      operation: "delete",
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
