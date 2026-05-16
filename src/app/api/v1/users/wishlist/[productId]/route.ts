import { NextRequest, NextResponse } from "next/server";
import { problemTypes } from "@/lib/http/problem-details";
import { authenticateToken } from "@/lib/middleware/auth";
import { usersService } from "@/lib/services/users.service";
import { toApiError } from "@/lib/types/errors";
import { logger } from "@/lib/utils/logger";

interface RouteContext {
  params: Promise<{ productId: string }>;
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const user = await authenticateToken(req);
    if (!user) {
      return NextResponse.json(
        {
          type: problemTypes.unauthorized,
          title: "Unauthorized",
          status: 401,
          detail: "Authentication token required",
          instance: req.url,
        },
        { status: 401 }
      );
    }

    const { productId } = await context.params;
    const result = await usersService.removeWishlistItem(user.id, productId);
    return NextResponse.json(result);
  } catch (error: unknown) {
    logger.error("Users wishlist remove item error", { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}
