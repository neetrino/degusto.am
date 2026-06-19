import { NextRequest, NextResponse } from "next/server";
import { authenticateToken } from "@/lib/middleware/auth";
import { extractGuestCartToken } from "@/lib/cart/guest-cart-cookies";
import { invalidateUserDashboardCache } from "@/lib/cache/user-dashboard-cache";
import { ordersService } from "@/lib/services/orders.service";
import { apiRouteCatchErrorResponse } from "@/lib/http/api-route-errors";
import { createProblem } from "@/lib/http/problem-details";
import { problemJson } from "@/lib/http/problem-response";
import { logger } from "@/lib/utils/logger";
import { safeParseCheckout } from "@/lib/schemas/checkout.schema";
import { enforceRouteRateLimit } from "@/lib/http/route-rate-limit";

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  try {
    const rateLimited = await enforceRouteRateLimit(req, {
      prefix: "ratelimit:checkout",
      limit: 12,
      window: "60 s",
      detail: "Too many checkout attempts. Please retry in a moment.",
    });
    if (rateLimited) {
      return rateLimited;
    }

    logger.info("Checkout request received");
    const user = await authenticateToken(req);
    const guestToken = user ? null : extractGuestCartToken(req);
    const body = await req.json();
    const parsed = safeParseCheckout(body);
    if (!parsed.success) {
      return problemJson(
        createProblem("validationError", {
          status: 400,
          title: "Validation Error",
          detail: parsed.error.issues[0]?.message ?? "Invalid checkout payload",
          instance: req.url,
        })
      );
    }
    const data = parsed.data;
    
    logger.debug("Checkout data", {
      userId: user?.id,
      cartId: data.cartId,
      itemsCount: data.items?.length || 0,
      email: data.email,
      phone: data.phone,
      paymentMethod: data.paymentMethod,
      shippingMethod: data.shippingMethod,
    });
    
    const result = await ordersService.checkout(data, user?.id, guestToken);
    if (user?.id) {
      void invalidateUserDashboardCache(user.id);
    }
    
    logger.info("Checkout successful", {
      orderNumber: result.order?.number,
      orderId: result.order?.id,
      total: result.order?.total,
    });
    
    const durationMs = Date.now() - startedAt;
    console.debug("[perf] POST /api/v1/orders/checkout", {
      durationMs,
      hasUser: Boolean(user?.id),
      usedGuestToken: Boolean(guestToken),
      paymentMethod: data?.paymentMethod,
      shippingMethod: data?.shippingMethod,
      itemsCount: Array.isArray(data?.items) ? data.items.length : 0,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    return apiRouteCatchErrorResponse(req, error, "[CHECKOUT] POST");
  }
}

