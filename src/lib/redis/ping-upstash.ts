import { Redis } from '@upstash/redis';
import { resolveUpstashRestCredentials } from '@/lib/redis/upstash-config';

export type RedisPingResult =
  | { ok: true; latencyMs: number }
  | { ok: false; reason: string };

/** Returns whether Upstash REST credentials are configured. */
export function isUpstashRedisConfigured(): boolean {
  return resolveUpstashRestCredentials() !== null;
}

/** Pings Upstash Redis (used by health checks). */
export async function pingUpstashRedis(): Promise<RedisPingResult> {
  const credentials = resolveUpstashRestCredentials();
  if (!credentials) {
    return { ok: false, reason: 'not_configured' };
  }

  const startedAt = Date.now();
  try {
    const redis = new Redis(credentials);
    const pong = await redis.ping();
    if (pong !== 'PONG') {
      return { ok: false, reason: 'unexpected_response' };
    }
    return { ok: true, latencyMs: Date.now() - startedAt };
  } catch {
    return { ok: false, reason: 'ping_failed' };
  }
}
