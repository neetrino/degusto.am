import * as jwt from 'jsonwebtoken';
import { db } from '@white-shop/db';
import { parseAuthTokenClaims } from '@/lib/auth/auth-token-claims';
import { cacheUserRoles, verifyAuthSessionClaimsOnNode } from '@/lib/auth/auth-session-store';
import { userHasAdminRole } from '@/lib/auth/user-roles.constants';
import type { AuthUser } from '@/lib/middleware/auth';
import { logger } from '@/lib/utils/logger';

/**
 * Authenticates a raw JWT string (cookie or Authorization header value).
 */
export async function authenticateTokenValue(
  token: string | null | undefined,
): Promise<AuthUser | null> {
  if (!token) {
    return null;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    logger.error('[AUTH] JWT_SECRET is not set');
    return null;
  }

  try {
    const decoded = jwt.verify(token, secret);
    const claims = parseAuthTokenClaims(decoded);
    if (!claims || !(await verifyAuthSessionClaimsOnNode(claims))) {
      return null;
    }

    const user = await db.user.findUnique({
      where: { id: claims.userId },
      select: {
        id: true,
        email: true,
        phone: true,
        locale: true,
        roles: true,
        blocked: true,
        deletedAt: true,
      },
    });

    if (!user || user.blocked || user.deletedAt) {
      return null;
    }

    if (userHasAdminRole(user.roles)) {
      await cacheUserRoles(user.id, user.roles);
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      locale: user.locale,
      roles: user.roles,
    };
  } catch (error) {
    if (
      error instanceof jwt.JsonWebTokenError ||
      error instanceof jwt.TokenExpiredError
    ) {
      return null;
    }
    throw error;
  }
}
