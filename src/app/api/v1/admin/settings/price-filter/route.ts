import { NextRequest, NextResponse } from "next/server";
import { problemTypes } from "@/lib/http/problem-details";
import { invalidateStorefrontProductFilterCaches } from "@/lib/cache/storefront-cache";
import { parseRouteCatchError } from "@/lib/http/api-route-errors";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";
import { logger } from "@/lib/utils/logger";

/**
 * GET /api/v1/admin/settings/price-filter
 * Get price filter settings (minPrice, maxPrice, stepSize, stepSizePerCurrency)
 */
export async function GET(req: NextRequest) {
  try {
    logger.debug('⚙️ [PRICE FILTER API] GET request received');
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      logger.debug('❌ [PRICE FILTER API] Unauthorized access attempt');
      return NextResponse.json(
        {
          type: problemTypes.forbidden,
          title: "Forbidden",
          status: 403,
          detail: "Admin access required",
          instance: req.url,
        },
        { status: 403 }
      );
    }

    const result = await adminService.getPriceFilterSettings();
    logger.debug('✅ [PRICE FILTER API] Settings retrieved:', result);
    return NextResponse.json(result);
  } catch (error: unknown) {
    logger.error("[PRICE FILTER API] GET Error", error);
    const e = parseRouteCatchError(error);
    return NextResponse.json(
      {
        type: e.type ?? problemTypes.internalError,
        title: e.title ?? "Internal Server Error",
        status: e.status ?? 500,
        detail: e.detail ?? e.message ?? "An error occurred",
        instance: req.url,
      },
      { status: e.status ?? 500 }
    );
  }
}

/**
 * PUT /api/v1/admin/settings/price-filter
 * Update price filter settings (minPrice, maxPrice, stepSize, stepSizePerCurrency)
 */
export async function PUT(req: NextRequest) {
  try {
    logger.debug('⚙️ [PRICE FILTER API] PUT request received');
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      logger.debug('❌ [PRICE FILTER API] Unauthorized access attempt');
      return NextResponse.json(
        {
          type: problemTypes.forbidden,
          title: "Forbidden",
          status: 403,
          detail: "Admin access required",
          instance: req.url,
        },
        { status: 403 }
      );
    }

    const data = await req.json();
    logger.debug('📤 [PRICE FILTER API] Update data received:', data);
    
    // Validate input
    if (data.minPrice !== null && data.minPrice !== undefined && (typeof data.minPrice !== 'number' || data.minPrice < 0)) {
      return NextResponse.json(
        {
          type: problemTypes.validationError,
          title: "Validation Error",
          status: 400,
          detail: "minPrice must be a valid positive number or null",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    if (data.maxPrice !== null && data.maxPrice !== undefined && (typeof data.maxPrice !== 'number' || data.maxPrice < 0)) {
      return NextResponse.json(
        {
          type: problemTypes.validationError,
          title: "Validation Error",
          status: 400,
          detail: "maxPrice must be a valid positive number or null",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    if (data.stepSize !== null && data.stepSize !== undefined && (typeof data.stepSize !== 'number' || data.stepSize <= 0)) {
      return NextResponse.json(
        {
          type: problemTypes.validationError,
          title: "Validation Error",
          status: 400,
          detail: "stepSize must be a valid positive number or null",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    // Validate stepSizePerCurrency (optional map: { USD, AMD, RUB, GEL })
    if (data.stepSizePerCurrency !== null && data.stepSizePerCurrency !== undefined) {
      if (typeof data.stepSizePerCurrency !== 'object') {
        return NextResponse.json(
          {
            type: problemTypes.validationError,
            title: "Validation Error",
            status: 400,
            detail: "stepSizePerCurrency must be an object map of currency codes to positive numbers or null",
            instance: req.url,
          },
          { status: 400 }
        );
      }

      const allowedCurrencies = ['USD', 'AMD', 'RUB', 'GEL'];
      for (const [code, value] of Object.entries(data.stepSizePerCurrency)) {
        if (!allowedCurrencies.includes(code)) {
          return NextResponse.json(
            {
              type: problemTypes.validationError,
              title: "Validation Error",
              status: 400,
              detail: `Unsupported currency code in stepSizePerCurrency: ${code}`,
              instance: req.url,
            },
            { status: 400 }
          );
        }
        if (value !== null && value !== undefined && (typeof value !== 'number' || value <= 0)) {
          return NextResponse.json(
            {
              type: problemTypes.validationError,
              title: "Validation Error",
              status: 400,
              detail: `stepSizePerCurrency.${code} must be a valid positive number or null`,
              instance: req.url,
            },
            { status: 400 }
          );
        }
      }
    }

    if (
      data.minPrice !== null && data.minPrice !== undefined &&
      data.maxPrice !== null && data.maxPrice !== undefined &&
      data.minPrice >= data.maxPrice
    ) {
      return NextResponse.json(
        {
          type: problemTypes.validationError,
          title: "Validation Error",
          status: 400,
          detail: "minPrice must be less than maxPrice",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    const result = await adminService.updatePriceFilterSettings(data);
    logger.debug('✅ [PRICE FILTER API] Settings updated:', result);
    await invalidateStorefrontProductFilterCaches();
    return NextResponse.json(result);
  } catch (error: unknown) {
    logger.error("[PRICE FILTER API] PUT Error", error);
    const e = parseRouteCatchError(error);
    return NextResponse.json(
      {
        type: e.type ?? problemTypes.internalError,
        title: e.title ?? "Internal Server Error",
        status: e.status ?? 500,
        detail: e.detail ?? e.message ?? "An error occurred",
        instance: req.url,
      },
      { status: e.status ?? 500 }
    );
  }
}

