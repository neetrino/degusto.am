import { NextRequest, NextResponse } from "next/server";
import { problemTypes } from "@/lib/http/problem-details";
import { authenticateToken, requireAdmin } from "@/lib/middleware/auth";
import { adminService } from "@/lib/services/admin.service";
import {
  canUploadProductImagesToR2,
  payloadContainsBase64Images,
  uploadProductPayloadBase64ImagesToR2,
  type ProductImagesPayload,
} from "@/lib/services/admin/admin-products-image-upload.service";
import { toApiError } from "@/lib/types/errors";
import { logger } from "@/lib/utils/logger";

/**
 * Валидация и нормализация параметров запроса для GET /api/v1/admin/products
 * @param searchParams - Параметры URL запроса
 * @returns Нормализованные фильтры или ошибку валидации
 */
function validateAndNormalizeFilters(searchParams: URLSearchParams): {
  filters?: {
    page: number;
    limit: number;
    search?: string;
    categories?: string[];
    sku?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
  };
  error?: {
    type: string;
    title: string;
    status: number;
    detail: string;
  };
} {
  // Валидация page
  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam, 10) : 1;
  if (pageParam && (isNaN(page) || page < 1)) {
    return {
      error: {
        type: problemTypes.validationError,
        title: "Validation Error",
        status: 400,
        detail: "Parameter 'page' must be a positive integer",
      },
    };
  }

  // Валидация limit
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 20;
  if (limitParam && (isNaN(limit) || limit < 1 || limit > 100)) {
    return {
      error: {
        type: problemTypes.validationError,
        title: "Validation Error",
        status: 400,
        detail: "Parameter 'limit' must be an integer between 1 and 100",
      },
    };
  }

  // Валидация minPrice
  const minPriceParam = searchParams.get("minPrice");
  let minPrice: number | undefined;
  if (minPriceParam) {
    minPrice = parseFloat(minPriceParam);
    if (isNaN(minPrice) || minPrice < 0) {
      return {
        error: {
          type: problemTypes.validationError,
          title: "Validation Error",
          status: 400,
          detail: "Parameter 'minPrice' must be a non-negative number",
        },
      };
    }
  }

  // Валидация maxPrice
  const maxPriceParam = searchParams.get("maxPrice");
  let maxPrice: number | undefined;
  if (maxPriceParam) {
    maxPrice = parseFloat(maxPriceParam);
    if (isNaN(maxPrice) || maxPrice < 0) {
      return {
        error: {
          type: problemTypes.validationError,
          title: "Validation Error",
          status: 400,
          detail: "Parameter 'maxPrice' must be a non-negative number",
        },
      };
    }
  }

  // Проверка логики: minPrice не должен быть больше maxPrice
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    return {
      error: {
        type: problemTypes.validationError,
        title: "Validation Error",
        status: 400,
        detail: "Parameter 'minPrice' cannot be greater than 'maxPrice'",
      },
    };
  }

  // Обработка categories
  const categoryParam = searchParams.get("category");
  const categories = categoryParam ? categoryParam.split(',').filter(Boolean) : undefined;

  return {
    filters: {
      page,
      limit,
      search: searchParams.get("search")?.trim() || undefined,
      categories,
      sku: searchParams.get("sku")?.trim() || undefined,
      minPrice,
      maxPrice,
      sort: searchParams.get("sort")?.trim() || undefined,
    },
  };
}

/**
 * GET /api/v1/admin/products
 * Get list of products with filters and pagination
 * 
 * Query parameters:
 * - page: number (default: 1, min: 1)
 * - limit: number (default: 20, min: 1, max: 100)
 * - search: string (optional)
 * - category: string (comma-separated, optional)
 * - sku: string (optional)
 * - minPrice: number (optional, non-negative)
 * - maxPrice: number (optional, non-negative)
 * - sort: string (optional)
 */
export async function GET(req: NextRequest) {
  const requestStartTime = Date.now();
  logger.debug("🌐 [ADMIN PRODUCTS API] GET request received", { url: req.url });
  
  try {
    // Аутентификация и проверка прав администратора
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      logger.warn("Unauthorized admin products access attempt", { userId: user?.id });
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

    // Валидация и нормализация параметров
    const { searchParams } = new URL(req.url);
    const validationResult = validateAndNormalizeFilters(searchParams);
    
    if (validationResult.error) {
      logger.warn("Admin products filters validation error", validationResult.error);
      return NextResponse.json(validationResult.error, { status: validationResult.error.status });
    }

    const filters = validationResult.filters!;
    logger.debug("🌐 [ADMIN PRODUCTS API] Calling adminService.getProducts with filters:", filters);
    
    const serviceStartTime = Date.now();
    const result = await adminService.getProducts(filters);
    const serviceTime = Date.now() - serviceStartTime;
    
    const totalTime = Date.now() - requestStartTime;
    logger.debug(`✅ [ADMIN PRODUCTS API] Request completed in ${totalTime}ms (service: ${serviceTime}ms)`, {
      page: filters.page,
      limit: filters.limit,
      resultCount: result.data?.length || 0,
    });
    
    return NextResponse.json(result, {
      headers: {
        'x-admin-products-total-ms': String(totalTime),
        'x-admin-products-service-ms': String(serviceTime),
      },
    });
  } catch (error: unknown) {
    const totalTime = Date.now() - requestStartTime;
    logger.error("Admin products GET failed", { durationMs: totalTime, error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}

/**
 * POST /api/v1/admin/products
 * Create a new product
 * 
 * Request body should contain:
 * - title: string (required)
 * - slug: string (required)
 * - subtitle?: string
 * - descriptionHtml?: string
 * - primaryCategoryId?: string
 * - categoryIds?: string[]
 * - published: boolean (required)
 * - featured?: boolean
 * - locale: string (required)
 * - media?: any[]
 * - labels?: Array<{type: string, value: string, position: string, color?: string}>
 * - attributeIds?: string[]
 * - variants: Array<{price: string|number, compareAtPrice?: string|number, stock: string|number, sku?: string, color?: string, size?: string, imageUrl?: string, published?: boolean}> (required)
 */
export async function POST(req: NextRequest) {
  const requestStartTime = Date.now();
  logger.debug("📤 [ADMIN PRODUCTS API] POST request received", { url: req.url });
  
  try {
    // Аутентификация и проверка прав администратора
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      logger.warn("Unauthorized admin product creation attempt", { userId: user?.id });
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

    // Парсинг тела запроса
    let body: ProductImagesPayload;
    try {
      body = await req.json();
    } catch (parseError: unknown) {
      logger.warn("Admin product creation JSON parse error", { error: parseError });
      return NextResponse.json(
        {
          type: problemTypes.validationError,
          title: "Validation Error",
          status: 400,
          detail: "Invalid JSON in request body",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    if (payloadContainsBase64Images(body) && !canUploadProductImagesToR2()) {
      return NextResponse.json(
        {
          type: problemTypes.configError,
          title: "Storage not configured",
          status: 503,
          detail:
            "R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL in .env",
          instance: req.url,
        },
        { status: 503 }
      );
    }

    if (payloadContainsBase64Images(body)) {
      body = await uploadProductPayloadBase64ImagesToR2(body);
    }

    // Базовая валидация обязательных полей
    if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
      return NextResponse.json(
        {
          type: problemTypes.validationError,
          title: "Validation Error",
          status: 400,
          detail: "Field 'title' is required and must be a non-empty string",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    if (!body.slug || typeof body.slug !== 'string' || body.slug.trim().length === 0) {
      return NextResponse.json(
        {
          type: problemTypes.validationError,
          title: "Validation Error",
          status: 400,
          detail: "Field 'slug' is required and must be a non-empty string",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    if (typeof body.published !== 'boolean') {
      return NextResponse.json(
        {
          type: problemTypes.validationError,
          title: "Validation Error",
          status: 400,
          detail: "Field 'published' is required and must be a boolean",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    if (!body.locale || typeof body.locale !== 'string') {
      return NextResponse.json(
        {
          type: problemTypes.validationError,
          title: "Validation Error",
          status: 400,
          detail: "Field 'locale' is required and must be a string",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.variants) || body.variants.length === 0) {
      return NextResponse.json(
        {
          type: problemTypes.validationError,
          title: "Validation Error",
          status: 400,
          detail: "Field 'variants' is required and must be a non-empty array",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    for (let i = 0; i < body.variants.length; i += 1) {
      const variant = body.variants[i] as { price?: unknown };
      const price =
        typeof variant?.price === "number"
          ? variant.price
          : Number.parseFloat(String(variant?.price ?? ""));
      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json(
          {
            type: problemTypes.validationError,
            title: "Validation Error",
            status: 400,
            detail: `Variant ${i + 1} must have a valid non-negative price`,
            instance: req.url,
          },
          { status: 400 }
        );
      }
    }

    logger.debug("📤 [ADMIN PRODUCTS API] Creating product:", {
      title: body.title,
      slug: body.slug,
      variantsCount: body.variants?.length || 0,
      hasMedia: !!body.media?.length,
    });

    const serviceStartTime = Date.now();
    const createPayload = body as Parameters<typeof adminService.createProduct>[0];
    const product = await adminService.createProduct(createPayload);
    const serviceTime = Date.now() - serviceStartTime;
    
    const totalTime = Date.now() - requestStartTime;
    logger.debug(`✅ [ADMIN PRODUCTS API] Product created in ${totalTime}ms (service: ${serviceTime}ms)`, {
      productId: product.id,
      title: product.title,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: unknown) {
    const totalTime = Date.now() - requestStartTime;
    logger.error("Admin products POST failed", { durationMs: totalTime, error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}

