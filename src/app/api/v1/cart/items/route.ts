import { NextRequest, NextResponse } from "next/server";
import { problemTypes } from "@/lib/http/problem-details";
import { cartService } from "@/lib/services/cart.service";
import { resolveCartRequestContext } from "@/lib/cart/cart-request-context";
import {
  createGuestCartToken,
  setGuestCartTokenOnResponse,
} from "@/lib/cart/guest-cart-cookies";
import { logger } from "@/lib/utils/logger";

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
    const e = error as {
      status?: number;
      title?: string;
      detail?: string;
      type?: string;
      message?: string;
    };

    if (e?.status === 422 && e?.title === "Insufficient stock") {
      logger.warn("Cart: add item rejected — insufficient stock", {
        detail: e.detail,
      });
    } else {
      logger.error("Cart: add item failed", { error });
    }

    return NextResponse.json(
      {
        type: e.type || problemTypes.internalError,
        title: e.title || "Internal Server Error",
        status: e.status || 500,
        detail: e.detail || e.message || "An error occurred",
        instance: req.url,
      },
      { status: e.status || 500 }
    );
  }
}
