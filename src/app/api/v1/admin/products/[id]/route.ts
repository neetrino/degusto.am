import { NextRequest, NextResponse } from "next/server";
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
 * GET /api/v1/admin/products/[id]
 * Get a single product by ID
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
    const product = await adminService.getProductById(id);

    return NextResponse.json(product);
  } catch (error: unknown) {
    logger.error("Admin product fetch failed", { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}

/**
 * PUT /api/v1/admin/products/[id]
 * Update a product
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
    let body: ProductImagesPayload = await req.json();

    if (payloadContainsBase64Images(body) && !canUploadProductImagesToR2()) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/config-error",
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

    logger.debug("📤 [ADMIN PRODUCTS] PUT request:", { 
      id, 
      bodyKeys: Object.keys(body),
      hasVariants: !!body.variants,
      variantsCount: body.variants?.length || 0
    });

    const updatePayload = body as Parameters<typeof adminService.updateProduct>[1];
    const product = await adminService.updateProduct(id, updatePayload);
    logger.debug("✅ [ADMIN PRODUCTS] Product updated:", { id, productId: product?.id });

    return NextResponse.json(product);
  } catch (error: unknown) {
    logger.error("Admin product update failed", { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}

/**
 * DELETE /api/v1/admin/products/[id]
 * Delete a product (soft delete)
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
    logger.debug("🗑️ [ADMIN PRODUCTS] DELETE request:", id);

    await adminService.deleteProduct(id);
    logger.debug("✅ [ADMIN PRODUCTS] Product deleted:", id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    logger.error("Admin product delete failed", { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}

