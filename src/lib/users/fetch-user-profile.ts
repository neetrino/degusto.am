'use client';

import { apiClient } from '../api-client';
import type { UserProfile } from '@/app/profile/types';

const USER_PROFILE_CACHE_TTL_MS = 30_000;

let cachedProfile: UserProfile | null = null;
let cachedProfileUpdatedAt = 0;
let inflightProfileRequest: Promise<UserProfile> | null = null;

function hasFreshProfileCache(now: number): boolean {
  return cachedProfile !== null && now - cachedProfileUpdatedAt <= USER_PROFILE_CACHE_TTL_MS;
}

export function invalidateUserProfileCache(): void {
  cachedProfile = null;
  cachedProfileUpdatedAt = 0;
}

/** Returns the in-memory profile when still within TTL; otherwise null. */
export function getCachedUserProfileSync(): UserProfile | null {
  const now = Date.now();
  if (hasFreshProfileCache(now) && cachedProfile) {
    return cachedProfile;
  }
  return null;
}

/** Deduplicates concurrent profile reads and reuses a short-lived in-memory cache. */
export async function fetchUserProfileCached(): Promise<UserProfile> {
  const now = Date.now();
  if (hasFreshProfileCache(now) && cachedProfile) {
    return cachedProfile;
  }

  if (inflightProfileRequest) {
    return inflightProfileRequest;
  }

  inflightProfileRequest = (async () => {
    const profile = await apiClient.get<UserProfile>('/api/v1/users/profile');
    cachedProfile = profile;
    cachedProfileUpdatedAt = Date.now();
    return profile;
  })();

  try {
    return await inflightProfileRequest;
  } finally {
    inflightProfileRequest = null;
  }
}
