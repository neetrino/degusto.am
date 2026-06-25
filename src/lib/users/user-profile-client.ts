'use client';

import { apiClient } from '@/lib/api-client';
import { createInflightGetCache } from '@/lib/admin/inflight-get-cache';

export type UserProfilePayload = {
  id: string;
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  roles?: string[];
  mfaEnabled?: boolean;
};

const USER_PROFILE_CACHE_TTL_MS = 5_000;
const USER_PROFILE_CACHE_DEV_TTL_MS = 30_000;

function resolveUserProfileCacheTtlMs(): number {
  return process.env.NODE_ENV === 'development'
    ? USER_PROFILE_CACHE_DEV_TTL_MS
    : USER_PROFILE_CACHE_TTL_MS;
}

type ProfileCache = ReturnType<typeof createInflightGetCache<UserProfilePayload>>;

declare global {
  var __degustoUserProfileCache: ProfileCache | undefined;
}

/** Survives Turbopack/HMR duplicate module instances in dev. */
function getProfileCache(): ProfileCache {
  if (!globalThis.__degustoUserProfileCache) {
    globalThis.__degustoUserProfileCache = createInflightGetCache<UserProfilePayload>(
      resolveUserProfileCacheTtlMs()
    );
  }
  return globalThis.__degustoUserProfileCache;
}

export function invalidateUserProfileCache(): void {
  getProfileCache().invalidate();
}

export async function fetchUserProfileCached(options?: { force?: boolean }): Promise<UserProfilePayload> {
  const cache = getProfileCache();
  if (options?.force) {
    cache.invalidate();
  }
  return cache.fetch(() => apiClient.get<UserProfilePayload>('/api/v1/users/profile'));
}
