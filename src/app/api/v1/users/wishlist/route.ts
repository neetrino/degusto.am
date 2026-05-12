import { NextRequest, NextResponse } from "next/server";
import { authenticateToken } from "@/lib/middleware/auth";
import { usersService } from "@/lib/services/users.service";
import { toApiError } from "@/lib/types/errors";
import { logger } from "@/lib/utils/logger";

function unauthorizedResponse(req: NextRequest) {
  return NextResponse.json(
    {
      type: "https://api.shop.am/problems/unauthorized",
      title: "Unauthorized",
      status: 401,
      detail: "Authentication token required",
      instance: req.url,
    },
    { status: 401 }
  );
}

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    if (!user) {
      return unauthorizedResponse(req);
    }

    const result = await usersService.getWishlistIds(user.id);
    return NextResponse.json(result);
  } catch (error: unknown) {
    logger.error("Users wishlist get error", { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    if (!user) {
      return unauthorizedResponse(req);
    }

    const body = await req.json();
    const result = await usersService.replaceWishlistIds(user.id, body?.ids);
    return NextResponse.json(result);
  } catch (error: unknown) {
    logger.error("Users wishlist replace error", { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    if (!user) {
      return unauthorizedResponse(req);
    }

    const body = await req.json();
    const result = await usersService.syncWishlist(user.id, body?.ids);
    return NextResponse.json(result);
  } catch (error: unknown) {
    logger.error("Users wishlist sync error", { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    if (!user) {
      return unauthorizedResponse(req);
    }

    const body = await req.json();
    const result = await usersService.addWishlistItem(user.id, body?.productId);
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    logger.error("Users wishlist add item error", { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}
