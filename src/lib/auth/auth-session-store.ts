import { jwtExpiresInToMaxAgeSeconds } from '@/lib/auth/jwt-expires-in';
import type { AuthTokenClaims } from '@/lib/auth/auth-token-claims';
import {
  createAuthSessionRedisClient,
  getCachedUserRolesOnEdge,
} from '@/lib/auth/auth-session-edge';
import {
  getUserSessionEpochFromDb,
  incrementUserSessionEpochInDb,
  isJtiRevokedInDb,
  persistRevokedJtiInDb,
} from '@/lib/auth/auth-session-db';

export { verifyAuthSessionClaimsOnEdge } from '@/lib/auth/auth-session-edge';

const SESSION_EPOCH_PREFIX = 'auth:epoch:';
const ROLES_CACHE_PREFIX = 'auth:roles:';
const REVOKED_JTI_PREFIX = 'auth:revoked:jti:';

function sessionTtlSeconds(): number {
  return jwtExpiresInToMaxAgeSeconds();
}

/** Current session epoch for a user (Redis cache with DB fallback). */
export async function getSessionEpoch(userId: string): Promise<number> {
  const redis = createAuthSessionRedisClient();
  if (redis) {
    const value = await redis.get<number>(`${SESSION_EPOCH_PREFIX}${userId}`);
    if (typeof value === 'number' && value >= 0) {
      return value;
    }
  }
  return getUserSessionEpochFromDb(userId);
}

/** Invalidates all outstanding JWTs for the user (password change, role change, etc.). */
export async function bumpSessionEpoch(userId: string): Promise<void> {
  const nextEpoch = await incrementUserSessionEpochInDb(userId);

  const redis = createAuthSessionRedisClient();
  if (!redis) {
    return;
  }

  const key = `${SESSION_EPOCH_PREFIX}${userId}`;
  await redis.set(key, nextEpoch, { ex: sessionTtlSeconds() });
  await redis.del(`${ROLES_CACHE_PREFIX}${userId}`);
}

/** Caches roles for middleware fast-path admin checks. */
export async function cacheUserRoles(userId: string, roles: string[]): Promise<void> {
  const redis = createAuthSessionRedisClient();
  if (!redis) {
    return;
  }
  await redis.set(`${ROLES_CACHE_PREFIX}${userId}`, roles, { ex: sessionTtlSeconds() });
}

/** Returns cached roles, or null when cache is empty/unavailable. */
export async function getCachedUserRoles(userId: string): Promise<string[] | null> {
  return getCachedUserRolesOnEdge(userId);
}

export async function invalidateCachedUserRoles(userId: string): Promise<void> {
  const redis = createAuthSessionRedisClient();
  if (!redis) {
    return;
  }
  await redis.del(`${ROLES_CACHE_PREFIX}${userId}`);
}

/** Revokes a single JWT by `jti` until natural expiry. */
export async function revokeTokenJti(jti: string, expiresAt: Date): Promise<void> {
  await persistRevokedJtiInDb(jti, expiresAt);

  const redis = createAuthSessionRedisClient();
  if (!redis) {
    return;
  }
  await redis.set(`${REVOKED_JTI_PREFIX}${jti}`, 1, { ex: sessionTtlSeconds() });
}

async function isTokenJtiRevokedOnEdge(jti: string): Promise<boolean> {
  const redis = createAuthSessionRedisClient();
  if (!redis) {
    return false;
  }
  const value = await redis.get<number>(`${REVOKED_JTI_PREFIX}${jti}`);
  return value === 1;
}

async function isTokenJtiRevokedOnNode(jti: string): Promise<boolean> {
  if (await isTokenJtiRevokedOnEdge(jti)) {
    return true;
  }
  return isJtiRevokedInDb(jti);
}

/** Validates session epoch and per-token revocation on Node API routes (DB + Redis). */
export async function verifyAuthSessionClaimsOnNode(
  claims: AuthTokenClaims,
): Promise<boolean> {
  const currentEpoch = await getSessionEpoch(claims.userId);
  if (claims.sessionEpoch < currentEpoch) {
    return false;
  }
  if (claims.jti && (await isTokenJtiRevokedOnNode(claims.jti))) {
    return false;
  }
  return true;
}

/** @deprecated Use verifyAuthSessionClaimsOnEdge or verifyAuthSessionClaimsOnNode. */
export async function verifyAuthSessionClaims(
  claims: AuthTokenClaims,
): Promise<boolean> {
  return verifyAuthSessionClaimsOnNode(claims);
}
