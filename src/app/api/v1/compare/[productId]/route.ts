import { NextRequest, NextResponse } from "next/server";
import { resolveCartRequestContext } from "@/lib/cart/cart-request-context";
import { compareService } from "@/lib/services/compare.service";
import { toApiError } from "@/lib/types/errors";
import { logger } from "@/lib/utils/logger";

type RouteContext = {
  params: Promise<{ productId: string }>;
};

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { productId } = await context.params;
    const { user, guestToken } = await resolveCartRequestContext(req);
    const result = await compareService.removeCompareItem(
      user?.id ?? null,
      guestToken,
      productId
    );
    return NextResponse.json(result);
  } catch (error: unknown) {
    logger.error("Compare remove item error", { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}
