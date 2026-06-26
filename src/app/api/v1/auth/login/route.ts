import { NextRequest, NextResponse } from "next/server";
import { setAuthCookiesOnResponse } from "@/lib/auth/auth-cookies";
import {
  clearGuestCartTokenOnResponse,
  extractGuestCartToken,
} from "@/lib/cart/guest-cart-cookies";
import { problemTypes } from "@/lib/http/problem-details";
import { authService } from "@/lib/services/auth.service";
import { mfaService } from "@/lib/services/mfa.service";
import { cartService } from "@/lib/services/cart.service";
import { toApiError } from "@/lib/types/errors";
import { logger } from "@/lib/utils/logger";
import { safeParseLogin } from "@/lib/schemas/auth.schema";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = safeParseLogin(body);
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors;
      const detail = Object.entries(first)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
        .join("; ") || parsed.error.message;
      return NextResponse.json(
        {
          type: problemTypes.validationError,
          title: "Validation failed",
          status: 400,
          detail,
          instance: req.url,
        },
        { status: 400 }
      );
    }
    const result = await authService.login(parsed.data);

    if (await mfaService.shouldRequireMfa(result.user.id)) {
      const challenge = mfaService.createChallenge(result.user.id);
      return NextResponse.json({
        requiresMfa: true,
        mfaToken: challenge.mfaToken,
      });
    }

    const response = NextResponse.json({ user: result.user });
    setAuthCookiesOnResponse(response, result.token, result.user);

    const guestToken = extractGuestCartToken(req);
    if (guestToken) {
      try {
        await cartService.mergeGuestCartIntoUser(
          guestToken,
          result.user.id,
          "en"
        );
      } catch (mergeError: unknown) {
        logger.warn("[CART] Guest cart merge on login failed", { error: mergeError });
      }
      clearGuestCartTokenOnResponse(response);
    }

    return response;
  } catch (error: unknown) {
    logger.error("Login error", { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}

