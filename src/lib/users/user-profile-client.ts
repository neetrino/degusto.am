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

export type UserAddressPayload = {
  id: string;
  firstName?: string;
  lastName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  countryCode?: string;
  phone?: string;
  isDefault?: boolean;
};

/** Full profile shape including addresses (checkout, profile page). */
export type UserProfileWithAddressesPayload = UserProfilePayload & {
  addresses?: UserAddressPayload[];
};

const USER_PROFILE_CACHE_TTL_MS = 5_000;
const USER_PROFILE_CACHE_DEV_TTL_MS = 30_000;

function resolveUserProfileCacheTtlMs(): number {
  return process.env.NODE_ENV === 'development'
    ? USER_PROFILE_CACHE_DEV_TTL_MS
    : USER_PROFILE_CACHE_TTL_MS;
}

type ProfileCache = ReturnType<typeof createInflightGetCache<unknown>>;

declare global {
  var __degustoUserProfileCache: ProfileCache | undefined;
}

/** Survives Turbopack/HMR duplicate module instances in dev. */
function getProfileCache(): ProfileCache {
  if (!globalThis.__degustoUserProfileCache) {
    globalThis.__degustoUserProfileCache = createInflightGetCache<unknown>(
      resolveUserProfileCacheTtlMs()
    );
  }
  return globalThis.__degustoUserProfileCache;
}

export function invalidateUserProfileCache(): void {
  getProfileCache().invalidate();
}

/** Keeps client cache aligned after profile PUT without an extra GET. */
export function seedUserProfileCache(profile: UserProfilePayload): void {
  getProfileCache().seed(profile);
}

export function peekUserProfileCached<T = UserProfilePayload>(): T | null {
  const cached = getProfileCache().peek();
  if (cached === null) {
    return null;
  }
  return cached as T;
}

/** Reuse an in-flight profile GET (e.g. AuthContext verify) instead of starting a duplicate request. */
export function getUserProfileInflight<T = UserProfilePayload>(): Promise<T> | null {
  const inflight = getProfileCache().getInflight();
  if (!inflight) {
    return null;
  }
  return inflight as Promise<T>;
}

export async function fetchUserProfileCached<T = UserProfilePayload>(
  options?: { force?: boolean }
): Promise<T> {
  const cache = getProfileCache();
  if (options?.force) {
    cache.invalidate();
  }
  return cache.fetch(() => apiClient.get<T>('/api/v1/users/profile')) as Promise<T>;
}
