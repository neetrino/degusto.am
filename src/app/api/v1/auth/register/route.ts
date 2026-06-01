import { NextRequest, NextResponse } from "next/server";
import { setAuthCookiesOnResponse } from "@/lib/auth/auth-cookies";
import { problemTypes } from "@/lib/http/problem-details";
import { authService } from "@/lib/services/auth.service";
import { toApiError } from "@/lib/types/errors";
import { logger } from "@/lib/utils/logger";
import { safeParseRegister } from "@/lib/schemas/auth.schema";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = safeParseRegister(body);
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors;
      const detail = Object.entries(first)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
        .join("; ") || parsed.error.message;
      return NextResponse.json(
        {
          type: problemTypes.validationError,
          title: "Validation failed",
          status: 400,
          detail,
          instance: req.url,
        },
        { status: 400 }
      );
    }
    const result = await authService.register(parsed.data);
    const response = NextResponse.json({ user: result.user }, { status: 201 });
    setAuthCookiesOnResponse(response, result.token, result.user);
    return response;
  } catch (error: unknown) {
    logger.error("Registration error", { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status || 500 });
  }
}

