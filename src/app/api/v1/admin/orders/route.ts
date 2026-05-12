import { NextRequest, NextResponse } from "next/server";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";
import { toApiError } from "@/lib/types/errors";
import { logger } from "@/lib/utils/logger";

const ORDER_STATUSES = ["pending", "processing", "completed", "cancelled"] as const;
const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const;
const SORT_FIELDS = ["createdAt", "total"] as const;
const SORT_ORDERS = ["asc", "desc"] as const;

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return NaN;
  }

  return parsed;
}

export async function GET(req: NextRequest) {
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

    // Extract and validate query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parsePositiveInt(searchParams.get("page"), 1);
    const limit = parsePositiveInt(searchParams.get("limit"), 20);
    const status = searchParams.get("status") || undefined;
    const paymentStatus = searchParams.get("paymentStatus") || undefined;
    const search = searchParams.get("search") || undefined;
    const sortBy = searchParams.get("sortBy") || undefined;
    const sortOrder = searchParams.get("sortOrder") || undefined;

    if (!Number.isFinite(page)) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Parameter 'page' must be a positive integer",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(limit) || limit > 100) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Parameter 'limit' must be an integer between 1 and 100",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    if (status && !ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: `Parameter 'status' must be one of: ${ORDER_STATUSES.join(", ")}`,
          instance: req.url,
        },
        { status: 400 }
      );
    }

    if (paymentStatus && !PAYMENT_STATUSES.includes(paymentStatus as (typeof PAYMENT_STATUSES)[number])) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: `Parameter 'paymentStatus' must be one of: ${PAYMENT_STATUSES.join(", ")}`,
          instance: req.url,
        },
        { status: 400 }
      );
    }

    if (sortBy && !SORT_FIELDS.includes(sortBy as (typeof SORT_FIELDS)[number])) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: `Parameter 'sortBy' must be one of: ${SORT_FIELDS.join(", ")}`,
          instance: req.url,
        },
        { status: 400 }
      );
    }

    if (sortOrder && !SORT_ORDERS.includes(sortOrder as (typeof SORT_ORDERS)[number])) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Parameter 'sortOrder' must be one of: asc, desc",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    const filters = {
      page,
      limit,
      ...(status && { status }),
      ...(paymentStatus && { paymentStatus }),
      ...(search && { search }),
      ...(sortBy && { sortBy }),
      ...(sortOrder && { sortOrder: sortOrder as 'asc' | 'desc' }),
    };

    logger.debug('📦 [ADMIN ORDERS] GET request with filters:', filters);
    const result = await adminService.getOrders(filters);
    return NextResponse.json(result);
  } catch (error: unknown) {
    logger.error("Admin orders list failed", { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}

