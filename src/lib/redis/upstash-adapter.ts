import { Redis } from "@upstash/redis";

import type { RedisAdapter, RedisClient } from "@/lib/redis/types";

export type UpstashRedisLike = {
  get: (key: string) => Promise<unknown>;
  set: (
    key: string,
    value: string,
    options?: { ex?: number; nx?: boolean },
  ) => Promise<unknown>;
  del: (key: string) => Promise<number>;
  getdel: (key: string) => Promise<unknown>;
};

export type UpstashAdapterConfig = {
  url: string;
  token: string;
  client?: UpstashRedisLike;
};

function asStoredString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

function wrapOfficialClient(redis: Redis): UpstashRedisLike {
  return {
    get: (key) => redis.get(key),
    set: (key, value, options) => {
      if (typeof options?.ex === "number" && options.nx) {
        return redis.set(key, value, { ex: options.ex, nx: true });
      }
      if (typeof options?.ex === "number") {
        return redis.set(key, value, { ex: options.ex });
      }
      if (options?.nx) {
        return redis.set(key, value, { nx: true });
      }
      return redis.set(key, value);
    },
    del: (key) => redis.del(key),
    getdel: (key) => redis.getdel(key),
  };
}

function createClient(redis: UpstashRedisLike): RedisClient {
  return {
    async get(key) {
      return asStoredString(await redis.get(key));
    },
    async set(key, value, options) {
      const result = await redis.set(key, value, options);
      return result === "OK" ? "OK" : null;
    },
    async del(key) {
      return redis.del(key);
    },
    async getdel(key) {
      return asStoredString(await redis.getdel(key));
    },
  };
}

/** Upstash Redis REST adapter for tokens, cache, and rate limits. */
export function createUpstashRedisAdapter(
  config: UpstashAdapterConfig,
): RedisAdapter {
  const redis = config.client ?? wrapOfficialClient(
    new Redis({
      url: config.url,
      token: config.token,
    }),
  );

  return {
    name: "upstash",
    getClient: () => createClient(redis),
  };
}
