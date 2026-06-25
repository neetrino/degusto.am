import * as jose from 'jose';
import { parseAuthTokenClaims, type AuthTokenClaims } from '@/lib/auth/auth-token-claims';
import { verifyAuthSessionClaimsOnEdge } from '@/lib/auth/auth-session-store';

/**
 * Verifies JWT signature/expiry and session claims in Edge middleware.
 */
export async function verifyJwtEdge(token: string): Promise<AuthTokenClaims | null> {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return null;
  }

  try {
    const key = new TextEncoder().encode(secret);
    const { payload } = await jose.jwtVerify(token, key);
    const claims = parseAuthTokenClaims(payload);
    if (!claims || !(await verifyAuthSessionClaimsOnEdge(claims))) {
      return null;
    }
    return claims;
  } catch {
    return null;
  }
}
