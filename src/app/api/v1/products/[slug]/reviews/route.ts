import { NextRequest, NextResponse } from "next/server";
import { resolveStorefrontLocaleFromSearchParams } from "@/lib/i18n/locale";
import { parseRouteCatchError } from "@/lib/http/api-route-errors";
import { reviewsService } from "@/lib/services/reviews.service";
import { authenticateToken } from "@/lib/middleware/auth";
import { productsService } from "@/lib/services/products.service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/products/[slug]/reviews
 * Get all reviews for a product (by slug)
 * Query params:
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
    
    logger.debug('📝 [REVIEWS API] GET request for product slug:', slug, { myReview });

    // First, get the product by slug to get the productId
    const product = await productsService.findBySlug(slug, lang);
    if (!product || !product.id) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/not-found",
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
            type: "https://api.shop.am/problems/unauthorized",
            title: "Unauthorized",
            status: 401,
            detail: "Authentication required",
            instance: req.url,
          },
          { status: 401 }
        );
      }

      const review = await reviewsService.getUserReview(product.id, user.id, true);
      return NextResponse.json(review);
    }

    // Otherwise, return all published reviews
    const reviews = await reviewsService.getProductReviews(product.id, {
      publishedOnly: true,
    });

    return NextResponse.json(reviews);
  } catch (error: unknown) {
    logger.error("[REVIEWS API] GET Error", error);
    const e = parseRouteCatchError(error);
    return NextResponse.json(
      {
        type: e.type ?? "https://api.shop.am/problems/internal-error",
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
          type: "https://api.shop.am/problems/unauthorized",
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
    const body = await req.json();

    logger.debug('📝 [REVIEWS API] POST request:', { slug, userId: user.id, rating: body.rating });

    // First, get the product by slug to get the productId
    const product = await productsService.findBySlug(slug, lang);
    if (!product || !product.id) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/not-found",
          title: "Product not found",
          status: 404,
          detail: `Product with slug '${slug}' does not exist`,
          instance: req.url,
        },
        { status: 404 }
      );
    }

    // Validate request body
    if (!body.rating || typeof body.rating !== 'number') {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Rating is required and must be a number",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    if (body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Rating must be between 1 and 5",
          instance: req.url,
        },
        { status: 400 }
      );
    }

    // Create review
    const review = await reviewsService.createReview(product.id, user.id, {
      rating: body.rating,
      comment: body.comment,
    });

    logger.debug('✅ [REVIEWS API] Review created:', review.id);

    return NextResponse.json(review, { status: 201 });
  } catch (error: unknown) {
    logger.error("[REVIEWS API] POST Error", error);
    const e = parseRouteCatchError(error);
    return NextResponse.json(
      {
        type: e.type ?? "https://api.shop.am/problems/internal-error",
        title: e.title ?? "Internal Server Error",
        status: e.status ?? 500,
        detail: e.detail ?? e.message ?? "An error occurred",
        instance: req.url,
      },
      { status: e.status ?? 500 }
    );
  }
}

