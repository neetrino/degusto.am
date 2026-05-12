import { NextRequest, NextResponse } from "next/server";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";
import { safeParseAdminOrderUpdate } from "@/lib/schemas/admin.schema";
import { toApiError } from "@/lib/types/errors";
import { logger } from "@/lib/utils/logger";

function getValidatedOrderId(rawId: unknown) {
  if (typeof rawId === "string" && rawId.trim().length > 0) {
    return rawId;
  }

  throw {
    status: 400,
    type: "https://api.shop.am/problems/bad-request",
    title: "Bad Request",
    detail: "Order ID is required and must be a valid string",
  };
}

/**
 * GET /api/v1/admin/orders/[id]
 * Get full order details for admin
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/forbidden",
          title: "Forbidden",
          status: 403,
          detail: "Admin access required",
          instance: req.url,
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    const orderId = getValidatedOrderId(id);
    logger.debug("📦 [ADMIN ORDERS] GET by id:", orderId);

    const order = await adminService.getOrderById(orderId);
    logger.debug("✅ [ADMIN ORDERS] Order loaded:", orderId);

    return NextResponse.json(order);
  } catch (error: unknown) {
    logger.error("Admin order fetch failed", { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}

/**
 * PUT /api/v1/admin/orders/[id]
 * Update an order
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/forbidden",
          title: "Forbidden",
          status: 403,
          detail: "Admin access required",
          instance: req.url,
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    const orderId = getValidatedOrderId(id);

    let body: unknown;
    try {
      body = await req.json();
    } catch (parseError: unknown) {
      logger.warn("Admin order update JSON parse error", { parseError });
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Invalid JSON in request body",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    const parsed = safeParseAdminOrderUpdate(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const detail =
        Object.entries(fieldErrors)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
          .join("; ") || parsed.error.message;
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail,
          instance: req.url,
        },
        { status: 400 }
      );
    }

    const order = await adminService.updateOrder(orderId, parsed.data);
    logger.debug("✅ [ADMIN ORDERS] Order updated:", orderId);

    return NextResponse.json(order);
  } catch (error: unknown) {
    logger.error("Admin order update failed", { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}

/**
 * DELETE /api/v1/admin/orders/[id]
 * Delete an order
 * Հեռացնում է պատվերը
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/forbidden",
          title: "Forbidden",
          status: 403,
          detail: "Admin access required",
          instance: req.url,
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    const orderId = getValidatedOrderId(id);

    logger.debug("🗑️ [ADMIN ORDERS] DELETE request:", { orderId, userId: user.id });
    await adminService.deleteOrder(orderId);
    logger.debug("✅ [ADMIN ORDERS] Order deleted successfully:", { orderId });

    return NextResponse.json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error: unknown) {
    logger.error("Admin order delete failed", { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}

