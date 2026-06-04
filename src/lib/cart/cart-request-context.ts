import type { NextRequest } from "next/server";
import { authenticateToken, type AuthUser } from "@/lib/middleware/auth";
import { resolveStorefrontLocale } from "@/lib/i18n/locale";
import { extractGuestCartToken } from "./guest-cart-cookies";

export interface CartRequestContext {
  user: AuthUser | null;
  locale: string;
  guestToken: string | null;
}

export async function resolveCartRequestContext(
  req: NextRequest
): Promise<CartRequestContext> {
  const user = await authenticateToken(req);
  const guestToken = user ? null : extractGuestCartToken(req);
  const locale = user?.locale ?? resolveStorefrontLocale(req.headers.get("accept-language"));

  return { user, locale, guestToken };
}
