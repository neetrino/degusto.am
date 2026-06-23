const CACHE_WARM_START_DELAY_MS = 2_000;
const CACHE_WARM_SECRET_HEADER = 'x-cache-warm-secret';

/**
 * Optional loopback warm after process start (`CACHE_WARM_ON_START=1` + `CACHE_WARM_SECRET`).
 * Does not import Redis directly — delegates to the internal warm route.
 */
export async function register(): Promise<void> {
  if (process.env.CACHE_WARM_ON_START !== '1') {
    return;
  }

  const secret = process.env.CACHE_WARM_SECRET?.trim();
  if (!secret) {
    return;
  }

  const port = process.env.PORT ?? '3000';
  const warmUrl = `http://127.0.0.1:${port}/api/internal/cache-warm`;

  setTimeout(() => {
    void fetch(warmUrl, {
      method: 'POST',
      headers: {
        [CACHE_WARM_SECRET_HEADER]: secret,
      },
    }).catch(() => {
      // Warm is best-effort on boot; missing route during dev is acceptable.
    });
  }, CACHE_WARM_START_DELAY_MS);
}
