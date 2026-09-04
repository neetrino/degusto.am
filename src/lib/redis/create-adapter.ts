import { createMemoryRedisAdapter } from "@/lib/redis/memory-adapter";
import { isUpstashConfigured } from "@/lib/redis/is-configured";
import { createUpstashRedisAdapter } from "@/lib/redis/upstash-adapter";
import type { RedisAdapter } from "@/lib/redis/types";

export type RedisAdapterEnv = {
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
};

/** Upstash when REST credentials exist; otherwise in-memory Redis. */
export function createRedisAdapter(env: RedisAdapterEnv): RedisAdapter {
  const credentials = {
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  };
  if (!isUpstashConfigured(credentials)) {
    return createMemoryRedisAdapter();
  }

  return createUpstashRedisAdapter(credentials);
}
