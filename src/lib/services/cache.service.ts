/**
 * Cache Service
 *
 * Service for Redis caching integration
 * Handles caching operations with graceful fallback if Redis is unavailable.
 * When Redis is not configured, uses in-memory cache (per process) for dev/local.
 */

import type Redis from "ioredis";
import { logger } from "@/lib/utils/logger";
import {
  l1Delete,
  l1DeleteMatchingPattern,
  l1Get,
  l1Set,
} from "@/lib/cache/l1-cache";
import { resolveUpstashRestCredentials } from "@/lib/redis/upstash-config";

// Redis client will be initialized lazily
let redisClient: Redis | null = null;
/** Upstash REST client when UPSTASH_REDIS_REST_* env vars are set */
let upstashClient: {
  get: (k: string) => Promise<string | null>;
  set: (k: string, v: string, opts?: Record<string, unknown>) => Promise<string | "OK" | null>;
  del: (...keys: string[]) => Promise<number>;
  keys: (pattern: string) => Promise<string[]>;
} | null = null;
let redisAvailable = false;
let connectionAttempted = false;
let errorLogged = false;
let lastErrorTime = 0;
const ERROR_COOLDOWN = 30000; // Only log errors every 30 seconds

/** In-memory fallback when Redis is not configured (dev/local) */
const MEMORY_CACHE_MAX_KEYS = 300;
const memoryCache = new Map<string, { value: string; expiresAt: number }>();

function memoryGet(key: string): string | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value;
}

function memorySetex(key: string, seconds: number, value: string): void {
  while (memoryCache.size >= MEMORY_CACHE_MAX_KEYS) {
    const firstKey = memoryCache.keys().next().value;
    if (firstKey) memoryCache.delete(firstKey);
    else break;
  }
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + seconds * 1000,
  });
}

/**
 * Initialize Redis client (Upstash REST or ioredis TCP)
 */
async function initRedis() {
  if (connectionAttempted) {
    return;
  }

  const upstashCredentials = resolveUpstashRestCredentials();
  const redisUrl = process.env.REDIS_URL;

  if (upstashCredentials) {
    try {
      const { Redis } = await import("@upstash/redis");
      upstashClient = new Redis(upstashCredentials);
      redisAvailable = true;
      connectionAttempted = true;
      return;
    } catch (error: unknown) {
      connectionAttempted = true;
      redisAvailable = false;
      logger.error("[CACHE] Failed to init Upstash Redis", error);
      return;
    }
  }

  const useRedisTcp = redisUrl && redisUrl !== "redis://localhost:6379";
  if (!useRedisTcp) {
    connectionAttempted = true;
    return;
  }

  try {
    // Dynamic import for serverless compatibility
    const IoRedis = (await import("ioredis")).default;

    redisClient = new IoRedis(redisUrl, {
      retryStrategy: (times: number) => {
        if (times > 3) {
          return null; // Stop retrying
        }
        return Math.min(times * 50, 2000);
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
      showFriendlyErrorStack: true,
      enableOfflineQueue: false,
      reconnectOnError: () => false, // Don't auto-reconnect
    });

    redisClient.on("connect", () => {
      logger.debug("✅ Redis connected");
      errorLogged = false;
      redisAvailable = true;
    });

    redisClient.on("ready", () => {
      redisAvailable = true;
    });

    redisClient.on("error", (error: Error) => {
      redisAvailable = false;
      const now = Date.now();
      if (!errorLogged || now - lastErrorTime > ERROR_COOLDOWN) {
        logger.error("Redis connection error", error.message, error);
        logger.warn("Check REDIS_URL in .env or start Redis server");
        errorLogged = true;
        lastErrorTime = now;
      }
    });

    await redisClient.connect();
    connectionAttempted = true;
  } catch (error: unknown) {
    connectionAttempted = true;
    redisAvailable = false;
    const msg = error instanceof Error ? error.message : String(error);
    logger.error("[CACHE] Failed to initialize Redis", msg, error);
  }
}

/**
 * Get value from cache
 */
export async function get(key: string): Promise<string | null> {
  const l1Hit = l1Get(key);
  if (l1Hit !== null) {
    return l1Hit;
  }

  if (!redisAvailable) {
    await initRedis();
  }

  if (!redisAvailable || (!redisClient && !upstashClient)) {
    return memoryGet(key);
  }

  try {
    if (upstashClient) {
      const v = await upstashClient.get(key);
      const value = v ?? null;
      if (value !== null) {
        l1Set(key, value);
      }
      return value;
    }
    if (redisClient) {
      const value = await redisClient.get(key);
      if (value !== null) {
        l1Set(key, value);
      }
      return value;
    }
    return null;
  } catch {
    return memoryGet(key);
  }
}

/**
 * Set value in cache
 */
export async function set(key: string, value: string): Promise<boolean> {
  if (!redisAvailable) {
    await initRedis();
  }

  if (!redisAvailable || (!redisClient && !upstashClient)) {
    return false;
  }

  try {
    if (upstashClient) {
      await upstashClient.set(key, value);
      return true;
    }
    if (redisClient) {
      await redisClient.set(key, value);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Set value in cache with expiration
 */
export async function setex(key: string, seconds: number, value: string): Promise<boolean> {
  if (!redisAvailable) {
    await initRedis();
  }

  if (!redisAvailable || (!redisClient && !upstashClient)) {
    memorySetex(key, seconds, value);
    return true;
  }

  try {
    if (upstashClient) {
      await upstashClient.set(key, value, { ex: seconds });
      l1Set(key, value);
      return true;
    }
    if (redisClient) {
      await redisClient.setex(key, seconds, value);
      l1Set(key, value);
      return true;
    }
    memorySetex(key, seconds, value);
    return true;
  } catch {
    memorySetex(key, seconds, value);
    return true;
  }
}

/**
 * Delete key from cache
 */
export async function del(key: string): Promise<boolean> {
  if (!redisAvailable) {
    await initRedis();
  }

  memoryCache.delete(key);
  l1Delete(key);

  if (!redisAvailable || (!redisClient && !upstashClient)) {
    return true;
  }

  try {
    if (upstashClient) {
      await upstashClient.del(key);
      return true;
    }
    if (redisClient) {
      await redisClient.del(key);
      return true;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Get multiple keys matching pattern
 */
export async function keys(pattern: string): Promise<string[]> {
  if (!redisAvailable) {
    await initRedis();
  }

  if (!redisAvailable || (!redisClient && !upstashClient)) {
    return [];
  }

  try {
    if (upstashClient) {
      return await upstashClient.keys(pattern);
    }
    if (redisClient) {
      return await redisClient.keys(pattern);
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Delete multiple keys matching pattern
 */
export async function deletePattern(pattern: string): Promise<number> {
  if (!redisAvailable) {
    await initRedis();
  }

  const regex = pattern.replace(/\*/g, ".*").replace(/\?/g, ".");
  const re = new RegExp(`^${regex}$`);
  let memoryDeleted = 0;
  for (const key of memoryCache.keys()) {
    if (re.test(key)) {
      memoryCache.delete(key);
      memoryDeleted++;
    }
  }
  const l1Deleted = l1DeleteMatchingPattern(pattern);

  if (!redisAvailable || (!redisClient && !upstashClient)) {
    return memoryDeleted + l1Deleted;
  }

  try {
    if (upstashClient) {
      const matchingKeys = await upstashClient.keys(pattern);
      if (matchingKeys.length > 0) {
        await upstashClient.del(...matchingKeys);
      }
      return matchingKeys.length + memoryDeleted + l1Deleted;
    }
    if (redisClient) {
      const matchingKeys = await redisClient.keys(pattern);
      if (matchingKeys.length > 0) {
        await redisClient.del(...matchingKeys);
      }
      return matchingKeys.length + memoryDeleted + l1Deleted;
    }
    return memoryDeleted + l1Deleted;
  } catch {
    return memoryDeleted + l1Deleted;
  }
}

/**
 * Check if Redis is available
 */
export function isAvailable(): boolean {
  return redisAvailable;
}

export const cacheService = {
  get,
  set,
  setex,
  del,
  keys,
  deletePattern,
  isAvailable,
};
