/**
 * Short-lived in-flight dedupe for client GETs (e.g. React Strict Mode double mount).
 *
 * Pass `ttlMs: 0` for inflight dedupe only — each completed fetch is immediately stale
 * for `peek()` / `fetch()` TTL hits (scheduled polls that must always reach the network).
 */
export function createInflightGetCache<T>(ttlMs: number) {
  let cache: T | null = null;
  let cacheUpdatedAt = 0;
  let inflight: Promise<T> | null = null;

  return {
    invalidate(): void {
      cache = null;
      cacheUpdatedAt = 0;
      inflight = null;
    },
    peek(): T | null {
      const now = Date.now();
      if (cache !== null && now - cacheUpdatedAt <= ttlMs) {
        return cache;
      }
      return null;
    },
    getInflight(): Promise<T> | null {
      return inflight;
    },
    seed(data: T): void {
      cache = data;
      cacheUpdatedAt = Date.now();
    },
    async fetch(fetcher: () => Promise<T>): Promise<T> {
      const now = Date.now();
      if (cache !== null && now - cacheUpdatedAt <= ttlMs) {
        return cache;
      }
      if (inflight) {
        return inflight;
      }

      inflight = fetcher()
        .then((data) => {
          cache = data;
          cacheUpdatedAt = Date.now();
          return data;
        })
        .finally(() => {
          inflight = null;
        });

      return inflight;
    },
  };
}

const inflightByKey = new Map<string, Promise<unknown>>();

/**
 * Dedupes concurrent GETs with the same key (no TTL — key encodes query params).
 */
export async function fetchWithInflightKey<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const existing = inflightByKey.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const request = fetcher().finally(() => {
    if (inflightByKey.get(key) === request) {
      inflightByKey.delete(key);
    }
  });

  inflightByKey.set(key, request);
  return request;
}
