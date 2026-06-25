import { Redis } from '@upstash/redis';
import type { AuthTokenClaims } from '@/lib/auth/auth-token-claims';
import { resolveUpstashRestCredentials } from '@/lib/redis/upstash-config';

const SESSION_EPOCH_PREFIX = 'auth:epoch:';
const ROLES_CACHE_PREFIX = 'auth:roles:';
const REVOKED_JTI_PREFIX = 'auth:revoked:jti:';

export function createAuthSessionRedisClient(): Redis | null {
  const credentials = resolveUpstashRestCredentials();
  return credentials ? new Redis(credentials) : null;
}

export async function getCachedUserRolesOnEdge(userId: string): Promise<string[] | null> {
  const redis = createAuthSessionRedisClient();
  if (!redis) {
    return null;
  }
  const value = await redis.get<string[]>(`${ROLES_CACHE_PREFIX}${userId}`);
  return Array.isArray(value) ? value : null;
}

async function getSessionEpochOnEdge(userId: string): Promise<number> {
  const redis = createAuthSessionRedisClient();
  if (!redis) {
    return 0;
  }
  const value = await redis.get<number>(`${SESSION_EPOCH_PREFIX}${userId}`);
  return typeof value === 'number' && value >= 0 ? value : 0;
}

async function isTokenJtiRevokedOnEdge(jti: string): Promise<boolean> {
  const redis = createAuthSessionRedisClient();
  if (!redis) {
    return false;
  }
  const value = await redis.get<number>(`${REVOKED_JTI_PREFIX}${jti}`);
  return value === 1;
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
