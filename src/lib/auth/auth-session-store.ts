import { Redis } from '@upstash/redis';
import { jwtExpiresInToMaxAgeSeconds } from '@/lib/auth/jwt-expires-in';
import type { AuthTokenClaims } from '@/lib/auth/auth-token-claims';
import {
  getUserSessionEpochFromDb,
  incrementUserSessionEpochInDb,
  isJtiRevokedInDb,
  persistRevokedJtiInDb,
} from '@/lib/auth/auth-session-db';
import { resolveUpstashRestCredentials } from '@/lib/redis/upstash-config';

const SESSION_EPOCH_PREFIX = 'auth:epoch:';
const ROLES_CACHE_PREFIX = 'auth:roles:';
const REVOKED_JTI_PREFIX = 'auth:revoked:jti:';

function createRedisClient(): Redis | null {
  const credentials = resolveUpstashRestCredentials();
  return credentials ? new Redis(credentials) : null;
}

function sessionTtlSeconds(): number {
  return jwtExpiresInToMaxAgeSeconds();
}

/** Current session epoch for a user (Redis cache with DB fallback). */
export async function getSessionEpoch(userId: string): Promise<number> {
  const redis = createRedisClient();
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

  const redis = createRedisClient();
  if (!redis) {
    return;
  }

  const key = `${SESSION_EPOCH_PREFIX}${userId}`;
  await redis.set(key, nextEpoch, { ex: sessionTtlSeconds() });
  await redis.del(`${ROLES_CACHE_PREFIX}${userId}`);
}

/** Caches roles for middleware fast-path admin checks. */
export async function cacheUserRoles(userId: string, roles: string[]): Promise<void> {
  const redis = createRedisClient();
  if (!redis) {
    return;
  }
  await redis.set(`${ROLES_CACHE_PREFIX}${userId}`, roles, { ex: sessionTtlSeconds() });
}

/** Returns cached roles, or null when cache is empty/unavailable. */
export async function getCachedUserRoles(userId: string): Promise<string[] | null> {
  const redis = createRedisClient();
  if (!redis) {
    return null;
  }
  const value = await redis.get<string[]>(`${ROLES_CACHE_PREFIX}${userId}`);
  return Array.isArray(value) ? value : null;
}

export async function invalidateCachedUserRoles(userId: string): Promise<void> {
  const redis = createRedisClient();
  if (!redis) {
    return;
  }
  await redis.del(`${ROLES_CACHE_PREFIX}${userId}`);
}

/** Revokes a single JWT by `jti` until natural expiry. */
export async function revokeTokenJti(jti: string, expiresAt: Date): Promise<void> {
  await persistRevokedJtiInDb(jti, expiresAt);

  const redis = createRedisClient();
  if (!redis) {
    return;
  }
  await redis.set(`${REVOKED_JTI_PREFIX}${jti}`, 1, { ex: sessionTtlSeconds() });
}

async function isTokenJtiRevokedOnEdge(jti: string): Promise<boolean> {
  const redis = createRedisClient();
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

async function getSessionEpochOnEdge(userId: string): Promise<number> {
  const redis = createRedisClient();
  if (!redis) {
    return 0;
  }
  const value = await redis.get<number>(`${SESSION_EPOCH_PREFIX}${userId}`);
  return typeof value === 'number' && value >= 0 ? value : 0;
}

/** Validates session epoch and per-token revocation in Edge middleware (Redis only). */
export async function verifyAuthSessionClaimsOnEdge(
  claims: AuthTokenClaims,
): Promise<boolean> {
  const currentEpoch = await getSessionEpochOnEdge(claims.userId);
  if (claims.sessionEpoch < currentEpoch) {
    return false;
  }
  if (claims.jti && (await isTokenJtiRevokedOnEdge(claims.jti))) {
    return false;
  }
  return true;
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
