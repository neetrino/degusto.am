import { NextRequest, NextResponse } from "next/server";
import { resolveCartRequestContext } from "@/lib/cart/cart-request-context";
import { apiRouteCatchErrorResponse } from "@/lib/http/api-route-errors";
import { compareService } from "@/lib/services/compare.service";

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
    return apiRouteCatchErrorResponse(req, error, "[COMPARE] DELETE");
  }
}
