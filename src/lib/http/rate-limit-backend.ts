import { NextResponse } from 'next/server';
import { problemTypes } from '@/lib/http/problem-details';
import { resolveUpstashRestCredentials } from '@/lib/redis/upstash-config';

/**
 * In production, rate limiting requires Upstash. Returns 503 when missing.
 */
export function rateLimitBackendUnavailableResponse(): NextResponse | null {
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }
  if (resolveUpstashRestCredentials()) {
    return null;
  }

  return NextResponse.json(
    {
      type: problemTypes.internalError,
      title: 'Service Unavailable',
      status: 503,
      detail: 'Rate limiting is not configured',
    },
    { status: 503 },
  );
}
