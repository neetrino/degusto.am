import { NextRequest, NextResponse } from "next/server";
import { parseRouteCatchError } from "@/lib/http/api-route-errors";
import { reviewsService } from "@/lib/services/reviews.service";
import { authenticateToken } from "@/lib/middleware/auth";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

/**
 * PUT /api/v1/reviews/[reviewId]
 * Update an existing review
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
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

    const { reviewId } = await params;
    const body = await req.json();

    logger.debug('📝 [REVIEWS API] PUT request:', { reviewId, userId: user.id, rating: body.rating });

    // Validate request body
    if (body.rating !== undefined && (typeof body.rating !== 'number' || body.rating < 1 || body.rating > 5)) {
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

    // Update review
    const review = await reviewsService.updateReview(reviewId, user.id, {
      rating: body.rating,
      comment: body.comment,
    });

    logger.debug('✅ [REVIEWS API] Review updated:', review.id);

    return NextResponse.json(review);
  } catch (error: unknown) {
    logger.error("[REVIEWS API] PUT Error", error);
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
 * DELETE /api/v1/reviews/[reviewId]
 * Delete a review
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
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

    const { reviewId } = await params;

    logger.debug('📝 [REVIEWS API] DELETE request:', { reviewId, userId: user.id });

    await reviewsService.deleteReview(reviewId, user.id);

    logger.debug('✅ [REVIEWS API] Review deleted:', reviewId);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    logger.error("[REVIEWS API] DELETE Error", error);
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

