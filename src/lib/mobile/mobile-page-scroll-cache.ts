import {
  MOBILE_SCROLL_CACHE_MAX_ENTRIES,
  MOBILE_SCROLL_CACHE_STORAGE_KEY,
} from '@/constants/mobile-page-cache';

type MobileScrollCacheStore = Record<string, number>;

export function normalizeMobileScrollCacheKey(pathname: string): string {
  const base = pathname.split('?')[0]?.split('#')[0] ?? '';
  return base || '/';
}

function readScrollCacheStore(): MobileScrollCacheStore {
  if (typeof sessionStorage === 'undefined') {
    return {};
  }

  try {
    const raw = sessionStorage.getItem(MOBILE_SCROLL_CACHE_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    const store: MobileScrollCacheStore = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
        store[key] = value;
      }
    }

    return store;
  } catch {
    return {};
  }
}

function writeScrollCacheStore(store: MobileScrollCacheStore): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }

  try {
    sessionStorage.setItem(MOBILE_SCROLL_CACHE_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Quota exceeded or private mode — ignore.
  }
}

function trimScrollCacheStore(store: MobileScrollCacheStore): MobileScrollCacheStore {
  const entries = Object.entries(store);
  if (entries.length <= MOBILE_SCROLL_CACHE_MAX_ENTRIES) {
    return store;
  }

  return Object.fromEntries(entries.slice(entries.length - MOBILE_SCROLL_CACHE_MAX_ENTRIES));
}

/** Reads saved vertical scroll position for a pathname (sessionStorage, mobile-only caller). */
export function readMobileScrollCache(pathname: string): number | null {
  const key = normalizeMobileScrollCacheKey(pathname);
  const value = readScrollCacheStore()[key];
  return typeof value === 'number' ? value : null;
}

/** Persists vertical scroll position for a pathname. */
export function writeMobileScrollCache(pathname: string, scrollY: number): void {
  if (!Number.isFinite(scrollY) || scrollY < 0) {
    return;
  }

  const key = normalizeMobileScrollCacheKey(pathname);
  const store = readScrollCacheStore();
  store[key] = Math.round(scrollY);
  writeScrollCacheStore(trimScrollCacheStore(store));
}
