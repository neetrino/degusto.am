import { NextRequest, NextResponse } from "next/server";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";
import { safeParseAdminOrderUpdate } from "@/lib/schemas/admin.schema";
import { toApiError } from "@/lib/types/errors";
import { logger } from "@/lib/utils/logger";

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
    logger.debug("📦 [ADMIN ORDERS] GET by id:", id);

    const order = await adminService.getOrderById(id);
    logger.debug("✅ [ADMIN ORDERS] Order loaded:", id);

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
    const body = await req.json();
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

    const order = await adminService.updateOrder(id, parsed.data);
    logger.debug("✅ [ADMIN ORDERS] Order updated:", id);

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
  const startTime = Date.now();
  let orderId: string | undefined;

  try {
    // Ստուգում ենք ավտորիզացիան
    logger.debug("🔐 [ADMIN ORDERS] DELETE - Ստուգվում է ավտորիզացիան...");
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      logger.debug("❌ [ADMIN ORDERS] DELETE - Մերժված մուտք (403)");
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

    // Ստանում ենք պատվերի ID-ն
    logger.debug("📋 [ADMIN ORDERS] DELETE - Ստանում ենք params...");
    let resolvedParams;
    try {
      resolvedParams = await params;
      logger.debug("✅ [ADMIN ORDERS] DELETE - Params ստացված:", resolvedParams);
    } catch (paramsError: any) {
      console.error("❌ [ADMIN ORDERS] DELETE - Params սխալ:", {
        error: paramsError,
        message: paramsError?.message,
        stack: paramsError?.stack,
      });
      throw {
        status: 400,
        type: "https://api.shop.am/problems/bad-request",
        title: "Bad Request",
        detail: "Invalid order ID parameter",
      };
    }

    orderId = resolvedParams?.id;
    
    // Validation
    if (!orderId || typeof orderId !== 'string' || orderId.trim() === '') {
      console.error("❌ [ADMIN ORDERS] DELETE - Invalid orderId:", orderId);
      throw {
        status: 400,
        type: "https://api.shop.am/problems/bad-request",
        title: "Bad Request",
        detail: "Order ID is required and must be a valid string",
      };
    }

    logger.debug("🗑️ [ADMIN ORDERS] DELETE request:", {
      orderId,
      userId: user.id,
      timestamp: new Date().toISOString(),
    });

    // Հեռացնում ենք պատվերը
    logger.debug("🔄 [ADMIN ORDERS] DELETE - Կանչվում է adminService.deleteOrder...");
    await adminService.deleteOrder(orderId);
    logger.debug("✅ [ADMIN ORDERS] DELETE - adminService.deleteOrder ավարտված");
    
    const duration = Date.now() - startTime;
    logger.debug("✅ [ADMIN ORDERS] Order deleted successfully:", {
      orderId,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ 
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    logger.error("Admin order delete failed", {
      orderId: orderId || "unknown",
      durationMs: duration,
      error,
    });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}

