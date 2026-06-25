'use client';

import { apiClient } from '@/lib/api-client';
import { createInflightGetCache } from '@/lib/admin/inflight-get-cache';

/** Production TTL — covers Strict Mode remount without stale data after mutations. */
export const ADMIN_READ_CACHE_TTL_MS = 5_000;

/** Dev TTL — reuse reads while navigating admin sub-pages in one session. */
const ADMIN_READ_CACHE_DEV_TTL_MS = 30_000;

export function resolveAdminReadCacheTtlMs(): number {
  return process.env.NODE_ENV === 'development'
    ? ADMIN_READ_CACHE_DEV_TTL_MS
    : ADMIN_READ_CACHE_TTL_MS;
}

type AdminReadCache<T> = ReturnType<typeof createInflightGetCache<T>>;

const caches = new Map<string, AdminReadCache<unknown>>();

function getAdminReadCache<T>(cacheKey: string): AdminReadCache<T> {
  const existing = caches.get(cacheKey);
  if (existing) {
    return existing as AdminReadCache<T>;
  }
  const created = createInflightGetCache<T>(resolveAdminReadCacheTtlMs());
  caches.set(cacheKey, created as AdminReadCache<unknown>);
  return created;
}

/** Stable query string for cache keys (`page=1&limit=20`). */
export function stableAdminQueryKey(params?: Record<string, string>): string {
  if (!params) {
    return '';
  }
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== '');
  if (entries.length === 0) {
    return '';
  }
  return entries
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
}

export function buildAdminReadCacheKey(path: string, params?: Record<string, string>): string {
  const query = stableAdminQueryKey(params);
  return query.length > 0 ? `${path}?${query}` : path;
}

export async function adminGetCached<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  options?: { force?: boolean }
): Promise<T> {
  const cache = getAdminReadCache<T>(cacheKey);
  if (options?.force) {
    cache.invalidate();
  }
  return cache.fetch(fetcher);
}

export async function adminGet<T>(
  path: string,
  options?: {
    params?: Record<string, string>;
    cacheKey?: string;
    force?: boolean;
  }
): Promise<T> {
  const cacheKey = options?.cacheKey ?? buildAdminReadCacheKey(path, options?.params);
  return adminGetCached(
    cacheKey,
    () => apiClient.get<T>(path, { params: options?.params }),
    { force: options?.force }
  );
}

/** Drop cached GET payloads (call after admin writes). Prefix matches cache keys. */
export function invalidateAdminReadCache(prefix?: string): void {
  if (!prefix) {
    caches.clear();
    return;
  }
  for (const key of caches.keys()) {
    if (key.startsWith(prefix)) {
      caches.delete(key);
    }
  }
}

export function invalidateAdminReadCacheKey(cacheKey: string): void {
  caches.get(cacheKey)?.invalidate();
  caches.delete(cacheKey);
}
