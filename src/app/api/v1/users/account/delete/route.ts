import { NextRequest, NextResponse } from "next/server";
import { authenticateToken } from "@/lib/middleware/auth";
import { usersService } from "@/lib/services/users.service";
import { toApiError } from "@/lib/types/errors";
import { logger } from "@/lib/utils/logger";

/**
 * Self-service account deletion (hard delete user row; orders unlinked).
 * Body: { password?: string, confirmation?: string } — password when account has a password set; otherwise confirmation must match email or phone.
 */
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

    const body = (await req.json()) as {
      password?: string;
      confirmation?: string;
      currentPassword?: string;
    };
    const password = body.password ?? body.currentPassword;

    const result = await usersService.deleteMyAccount(user.id, {
      password: typeof password === "string" ? password : undefined,
      confirmation: typeof body.confirmation === "string" ? body.confirmation : undefined,
    });
    return NextResponse.json(result);
  } catch (error: unknown) {
    logger.error("Account delete error", { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}
