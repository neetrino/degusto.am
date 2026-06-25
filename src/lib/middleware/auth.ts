import { NextRequest } from "next/server";
import { extractAuthTokenFromRequest } from "@/lib/auth/auth-cookies";
import { authenticateTokenValue } from "@/lib/auth/authenticate-token-value";
import { userHasAdminRole } from "@/lib/auth/user-roles.constants";

export interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
  locale: string;
  roles: string[];
}

/**
 * Authenticate JWT from Authorization header or HttpOnly auth cookie.
 */
export async function authenticateToken(
  request: NextRequest
): Promise<AuthUser | null> {
  return authenticateTokenValue(extractAuthTokenFromRequest(request));
}

/**
 * Check if user is admin
 */
export function requireAdmin(user: AuthUser | null): boolean {
  return userHasAdminRole(user?.roles);
}
