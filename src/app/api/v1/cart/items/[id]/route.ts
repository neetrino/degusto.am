import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createProblem, problemTypes } from "@/lib/http/problem-details";
import { apiRouteCatchErrorResponse } from "@/lib/http/api-route-errors";
import { problemJson } from "@/lib/http/problem-response";
import { cartService } from "@/lib/services/cart.service";
import { resolveCartRequestContext } from "@/lib/cart/cart-request-context";
import { toCartApiStableResponse } from "@/lib/cart/cart-api-response";
import { logger } from "@/lib/utils/logger";

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
  try {
    const { user, guestToken, locale } = await resolveCartRequestContext(req);
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
    const idParsed = cartItemIdSchema.safeParse(id);
    if (!idParsed.success) {
      return problemJson(
        createProblem("badRequest", {
          status: 400,
          title: "Bad Request",
          detail: idParsed.error.issues[0]?.message ?? "Invalid cart item id",
          instance: req.url,
        })
      );
    }

    const dataParsed = updateCartItemQuantitySchema.safeParse(await req.json());
    if (!dataParsed.success) {
      return problemJson(
        createProblem("validationError", {
          status: 400,
          title: "Validation Error",
          detail: dataParsed.error.issues[0]?.message ?? "Invalid quantity",
          instance: req.url,
        })
      );
    }

    await cartService.updateItem(
      user?.id ?? null,
      idParsed.data,
      dataParsed.data.quantity,
      guestToken
    );
    const updatedCart = await cartService.getCart(user?.id ?? null, locale, guestToken);
    const normalized = toCartApiStableResponse(updatedCart.cart);
    logger.info("[CART] update item ok", {
      requestPath: req.nextUrl.pathname,
      method: req.method,
      responseStatus: 200,
      durationMs: Date.now() - startedAt,
      hasUser: Boolean(user?.id),
      hasGuestToken: Boolean(guestToken),
      cartItemId: idParsed.data,
      quantity: dataParsed.data.quantity,
    });
    return NextResponse.json(normalized, { status: 200 });
  } catch (error: unknown) {
    return apiRouteCatchErrorResponse(req, error, "[CART] UPDATE item");
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
  try {
    const { user, guestToken, locale } = await resolveCartRequestContext(req);
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
    const idParsed = cartItemIdSchema.safeParse(id);
    if (!idParsed.success) {
      return problemJson(
        createProblem("badRequest", {
          status: 400,
          title: "Bad Request",
          detail: idParsed.error.issues[0]?.message ?? "Invalid cart item id",
          instance: req.url,
        })
      );
    }

    await cartService.removeItem(user?.id ?? null, idParsed.data, guestToken);
    const updatedCart = await cartService.getCart(user?.id ?? null, locale, guestToken);
    const normalized = toCartApiStableResponse(updatedCart.cart);

    logger.info("[CART] delete item ok", {
      requestPath: req.nextUrl.pathname,
      method: req.method,
      responseStatus: 200,
      durationMs: Date.now() - startedAt,
      hasUser: Boolean(user?.id),
      hasGuestToken: Boolean(guestToken),
      cartItemId: idParsed.data,
    });
    return NextResponse.json(normalized, { status: 200 });
  } catch (error: unknown) {
    return apiRouteCatchErrorResponse(req, error, "[CART] DELETE item");
  }
}
