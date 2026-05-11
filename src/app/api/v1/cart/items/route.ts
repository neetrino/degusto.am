import { NextRequest, NextResponse } from "next/server";
import { authenticateToken } from "@/lib/middleware/auth";
import { cartService } from "@/lib/services/cart.service";
import { logger } from "@/lib/utils/logger";

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    if (!user) {
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

    const data = await req.json();
    const result = await cartService.addItem(user.id, data, user.locale);
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    const e = error as {
      status?: number;
      title?: string;
      detail?: string;
      type?: string;
      message?: string;
    };

    if (e?.status === 422 && e?.title === "Insufficient stock") {
      logger.warn("Cart: add item rejected — insufficient stock", {
        detail: e.detail,
      });
    } else {
      logger.error("Cart: add item failed", { error });
    }

    return NextResponse.json(
      {
        type: e.type || "https://api.shop.am/problems/internal-error",
        title: e.title || "Internal Server Error",
        status: e.status || 500,
        detail: e.detail || e.message || "An error occurred",
        instance: req.url,
      },
      { status: e.status || 500 }
    );
  }
}

