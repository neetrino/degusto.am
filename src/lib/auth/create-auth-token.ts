import * as jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { cacheUserRoles, getSessionEpoch } from '@/lib/auth/auth-session-store';

/**
 * Issues a signed JWT with session epoch and `jti` for revocation support.
 */
export async function createAuthToken(userId: string, roles: string[]): Promise<string> {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  const sessionEpoch = await getSessionEpoch(userId);
  await cacheUserRoles(userId, roles);

  return jwt.sign(
    { userId, sessionEpoch, jti: nanoid(), roles },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions,
  );
}
