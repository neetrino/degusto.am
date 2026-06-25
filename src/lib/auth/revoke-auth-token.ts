import * as jwt from 'jsonwebtoken';
import { parseAuthTokenClaims } from '@/lib/auth/auth-token-claims';
import { revokeTokenJti } from '@/lib/auth/auth-session-store';

function resolveTokenExpiryDate(decoded: unknown): Date {
  if (!decoded || typeof decoded !== 'object') {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
  const exp = (decoded as { exp?: unknown }).exp;
  if (typeof exp === 'number' && Number.isFinite(exp)) {
    return new Date(exp * 1000);
  }
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}

/**
 * Revokes the current JWT (`jti`) when present. Ignores invalid/expired tokens.
 */
export async function revokeAuthToken(token: string): Promise<void> {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return;
  }

  try {
    const decoded = jwt.verify(token, secret);
    const claims = parseAuthTokenClaims(decoded);
    if (claims?.jti) {
      await revokeTokenJti(claims.jti, resolveTokenExpiryDate(decoded));
    }
  } catch {
    // Best-effort — cookie clear still logs the user out locally.
  }
}
