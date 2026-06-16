import { NextRequest, NextResponse } from "next/server";
import { problemTypes } from "@/lib/http/problem-details";
import { apiRouteCatchErrorResponse } from "@/lib/http/api-route-errors";
import { resolveStorefrontLocaleFromSearchParams } from "@/lib/i18n/locale";
import { reviewsService } from "@/lib/services/reviews.service";
import { resolveReviewsProductId } from "@/lib/services/reviews/resolve-reviews-product-id";
import { authenticateToken } from "@/lib/middleware/auth";
import { productsService } from "@/lib/services/products.service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
const DEFAULT_REVIEWS_LIMIT = 20;
const MAX_REVIEWS_LIMIT = 50;

function parsePaginationParams(searchParams: URLSearchParams): { skip: number; take: number } {
  const pageParam = Number(searchParams.get("page") ?? "1");
  const limitParam = Number(searchParams.get("limit") ?? String(DEFAULT_REVIEWS_LIMIT));
  const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;
  const limit = Number.isFinite(limitParam) && limitParam > 0
    ? Math.min(Math.floor(limitParam), MAX_REVIEWS_LIMIT)
    : DEFAULT_REVIEWS_LIMIT;
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

/**
 * GET /api/v1/products/[slug]/reviews
 * Get all reviews for a product (by slug)
 * Query params:
 *   - productId: optional; skips full findBySlug when it matches slug (PDP fast path)
 *   - my=true: Get current user's review (requires authentication)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const lang = resolveStorefrontLocaleFromSearchParams(searchParams);
    const myReview = searchParams.get("my") === "true";
    const productIdParam = searchParams.get("productId");
    const { skip, take } = parsePaginationParams(searchParams);

    logger.debug("[REVIEWS API] GET", { slug, myReview, hasProductId: Boolean(productIdParam?.trim()) });

    const trimmedProductId = productIdParam?.trim();

    if (!myReview && trimmedProductId) {
      const fastPath = await reviewsService.getPublishedReviewsForSlugAndProductId(
        slug,
        trimmedProductId,
        { skip, take },
      );
      if (fastPath.status === "not_found") {
        return NextResponse.json(
          {
            type: problemTypes.notFound,
            title: "Product not found",
            status: 404,
            detail: `Product with slug '${slug}' does not exist`,
            instance: req.url,
          },
          { status: 404 }
        );
      }
      return NextResponse.json(fastPath.reviews);
    }

    const productId = await resolveReviewsProductId(slug, lang, productIdParam);
    if (!productId) {
      return NextResponse.json(
        {
          type: problemTypes.notFound,
          title: "Product not found",
          status: 404,
          detail: `Product with slug '${slug}' does not exist`,
          instance: req.url,
        },
        { status: 404 }
      );
    }

    // If my=true, return user's review
    if (myReview) {
      const user = await authenticateToken(req);
      if (!user) {
        return NextResponse.json(
          {
            type: problemTypes.unauthorized,
            title: "Unauthorized",
            status: 401,
            detail: "Authentication required",
            instance: req.url,
          },
          { status: 401 }
        );
      }

      const review = await reviewsService.getUserReview(productId, user.id, true);
      return NextResponse.json(review);
    }

    // Otherwise, return all published reviews
    const reviews = await reviewsService.getProductReviews(productId, {
      publishedOnly: true,
      skip,
      take,
    });

    return NextResponse.json(reviews);
  } catch (error: unknown) {
    return apiRouteCatchErrorResponse(req, error, "[REVIEWS API] GET Error");
  }
}

function validateReviewCreatePayload(body: unknown): { rating: number; comment?: string } {
  if (!body || typeof body !== "object") {
    throw {
      status: 400,
      type: problemTypes.validationError,
      title: "Validation Error",
      detail: "Request body must be a JSON object",
    };
  }

  const payload = body as { rating?: unknown; comment?: unknown };
  if (typeof payload.rating !== "number" || !Number.isFinite(payload.rating)) {
    throw {
      status: 400,
      type: problemTypes.validationError,
      title: "Validation Error",
      detail: "Rating is required and must be a number",
    };
  }
  if (payload.rating < 1 || payload.rating > 5) {
    throw {
      status: 400,
      type: problemTypes.validationError,
      title: "Validation Error",
      detail: "Rating must be between 1 and 5",
    };
  }
  if (payload.comment !== undefined && payload.comment !== null && typeof payload.comment !== "string") {
    throw {
      status: 400,
      type: problemTypes.validationError,
      title: "Validation Error",
      detail: "Comment must be a string",
    };
  }

  return {
    rating: payload.rating,
    comment: typeof payload.comment === "string" ? payload.comment : undefined,
  };
}

/**
 * POST /api/v1/products/[slug]/reviews
 * Create a new review for a product (by slug)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Authenticate user
    const user = await authenticateToken(req);
    if (!user) {
      return NextResponse.json(
        {
          type: problemTypes.unauthorized,
          title: "Unauthorized",
          status: 401,
          detail: "Authentication required",
          instance: req.url,
        },
        { status: 401 }
      );
    }

    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const lang = resolveStorefrontLocaleFromSearchParams(searchParams);
    const payload = validateReviewCreatePayload(await req.json());

    logger.debug('📝 [REVIEWS API] POST request:', { slug, userId: user.id, rating: payload.rating });

    // First, get the product by slug to get the productId
    const product = await productsService.findBySlug(slug, lang);
    if (!product || !product.id) {
      return NextResponse.json(
        {
          type: problemTypes.notFound,
          title: "Product not found",
          status: 404,
          detail: `Product with slug '${slug}' does not exist`,
          instance: req.url,
        },
        { status: 404 }
      );
    }

    // Create review
    const review = await reviewsService.createReview(product.id, user.id, {
      rating: payload.rating,
      comment: payload.comment,
    });

    logger.debug('✅ [REVIEWS API] Review created:', review.id);

    return NextResponse.json(review, { status: 201 });
  } catch (error: unknown) {
    return apiRouteCatchErrorResponse(req, error, "[REVIEWS API] POST Error");
  }
}

