import { NextRequest, NextResponse } from "next/server";
import { resolveCartRequestContext } from "@/lib/cart/cart-request-context";
import {
  createGuestCartToken,
  setGuestCartTokenOnResponse,
} from "@/lib/cart/guest-cart-cookies";
import { compareService } from "@/lib/services/compare.service";
import { toApiError } from "@/lib/types/errors";
import { logger } from "@/lib/utils/logger";

export async function GET(req: NextRequest) {
  try {
    const { user, guestToken } = await resolveCartRequestContext(req);
    const result = await compareService.getCompareIds(user?.id ?? null, guestToken);
    return NextResponse.json(result);
  } catch (error: unknown) {
    logger.error("Compare get error", { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, guestToken } = await resolveCartRequestContext(req);
    const body = await req.json();

    const isNewGuestSession = !user && !guestToken;
    const activeGuestToken = user ? null : guestToken ?? createGuestCartToken();

    const result = await compareService.addCompareItem(
      user?.id ?? null,
      activeGuestToken,
      body?.productId
    );

    const response = NextResponse.json(result, { status: 201 });
    if (isNewGuestSession && activeGuestToken) {
      setGuestCartTokenOnResponse(response, activeGuestToken);
    }
    return response;
  } catch (error: unknown) {
    logger.error("Compare add item error", { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}
