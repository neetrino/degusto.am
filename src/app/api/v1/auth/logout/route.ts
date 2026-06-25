import { NextRequest, NextResponse } from "next/server";
import {
  clearAuthCookiesOnResponse,
  extractAuthTokenFromRequest,
} from "@/lib/auth/auth-cookies";
import { revokeAuthToken } from "@/lib/auth/revoke-auth-token";

export async function POST(req: NextRequest) {
  const token = extractAuthTokenFromRequest(req);
  if (token) {
    await revokeAuthToken(token);
  }

  const response = NextResponse.json({ ok: true });
  clearAuthCookiesOnResponse(response);
  return response;
}
