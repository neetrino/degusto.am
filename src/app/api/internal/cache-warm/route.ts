import { NextRequest, NextResponse } from 'next/server';
import { warmStorefrontCaches } from '@/lib/services/storefront/warm-storefront-caches';
import { logger } from '@/lib/utils/logger';

const CACHE_WARM_SECRET_HEADER = 'x-cache-warm-secret';

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.CACHE_WARM_SECRET?.trim();
  if (!expected) {
    return false;
  }
  const provided = req.headers.get(CACHE_WARM_SECRET_HEADER)?.trim();
  return Boolean(provided && provided === expected);
}

/** Internal POST — warms home, shop, combo, and top PDP caches after deploy / cold start. */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await warmStorefrontCaches();
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    logger.error('[CACHE WARM] Storefront warm failed', error);
    return NextResponse.json({ error: 'Warm failed' }, { status: 500 });
  }
}
