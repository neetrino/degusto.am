import { NextResponse } from 'next/server';
import { isUpstashRedisConfigured, pingUpstashRedis } from '@/lib/redis/ping-upstash';

/**
 * GET /api/health/redis
 * Verifies Upstash Redis connectivity (no secrets in response).
 */
export async function GET() {
  if (!isUpstashRedisConfigured()) {
    return NextResponse.json(
      {
        status: 'error',
        redis: 'not_configured',
      },
      { status: 503, headers: { 'Retry-After': '60' } },
    );
  }

  const result = await pingUpstashRedis();
  if (!result.ok) {
    return NextResponse.json(
      {
        status: 'error',
        redis: 'down',
        reason: result.reason,
      },
      { status: 503, headers: { 'Retry-After': '15' } },
    );
  }

  return NextResponse.json({
    status: 'ok',
    redis: 'up',
    latencyMs: result.latencyMs,
  });
}
