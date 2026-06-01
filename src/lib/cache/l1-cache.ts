/** Process-local hot cache in front of Redis (short TTL, avoids Upstash RTT on repeat reads). */
export const L1_CACHE_TTL_SECONDS = 30;

const L1_CACHE_MAX_KEYS = 500;

type L1Entry = {
  value: string;
  expiresAt: number;
};

const l1Cache = new Map<string, L1Entry>();

export function l1Get(key: string): string | null {
  const entry = l1Cache.get(key);
  if (!entry) {
    return null;
  }
  if (Date.now() > entry.expiresAt) {
    l1Cache.delete(key);
    return null;
  }
  return entry.value;
}

export function l1Set(key: string, value: string, ttlSeconds: number = L1_CACHE_TTL_SECONDS): void {
  while (l1Cache.size >= L1_CACHE_MAX_KEYS) {
    const firstKey = l1Cache.keys().next().value;
    if (firstKey) {
      l1Cache.delete(firstKey);
    } else {
      break;
    }
  }
  l1Cache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export function l1Delete(key: string): void {
  l1Cache.delete(key);
}

export function l1DeleteMatchingPattern(pattern: string): number {
  const regex = pattern.replace(/\*/g, ".*").replace(/\?/g, ".");
  const re = new RegExp(`^${regex}$`);
  let deleted = 0;
  for (const key of l1Cache.keys()) {
    if (re.test(key)) {
      l1Cache.delete(key);
      deleted += 1;
    }
  }
  return deleted;
}

export function l1Clear(): void {
  l1Cache.clear();
}
