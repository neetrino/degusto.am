import { Prisma } from '@prisma/client';
import { isNextBuildWithoutDbEnv } from '@white-shop/db';
import { isPrismaConnectionError } from '@/lib/http/api-route-errors';
import { logger } from '@/lib/utils/logger';

/** Retries transient pool timeouts before returning fallback. */
export const PRISMA_POOL_RETRY_ATTEMPTS = 2;

const PRISMA_POOL_RETRY_DELAY_MS = 150;

function isPrismaPoolTimeout(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2024';
}

/**
 * Runs a Prisma-backed operation with retries on pool timeouts.
 * Connection failures return the provided fallback to keep storefront SSR responsive.
 * Next.js production builds without a real DATABASE_URL use empty fallbacks so CI/`next build` can finish.
 * Local development without Postgres also falls back while still logging diagnostics.
 */
export async function withPrismaResilience<T>(
  operation: () => Promise<T>,
  fallback: T,
  scope: string,
  step: string
): Promise<T> {
  for (let attempt = 0; attempt <= PRISMA_POOL_RETRY_ATTEMPTS; attempt += 1) {
    try {
      return await operation();
    } catch (error: unknown) {
      if (isPrismaConnectionError(error)) {
        const code =
          error instanceof Prisma.PrismaClientKnownRequestError ? error.code : 'initialization';
        logger.error(`[${scope}] Database unreachable in ${step}`, {
          code,
          nodeEnv: process.env.NODE_ENV,
          vercel: process.env.VERCEL === '1',
        });
        if (isNextBuildWithoutDbEnv()) {
          return fallback;
        }
        logger.warn(`[${scope}] Using safe fallback for ${step}`);
        return fallback;
      }
      if (!isPrismaPoolTimeout(error)) {
        throw error;
      }
      const isLastAttempt = attempt === PRISMA_POOL_RETRY_ATTEMPTS;
      logger.warn(`[${scope}] Prisma connection pool timeout in ${step}`, {
        attempt: attempt + 1,
        maxAttempts: PRISMA_POOL_RETRY_ATTEMPTS + 1,
      });
      if (isLastAttempt) {
        logger.error(`[${scope}] Falling back after repeated pool timeouts in ${step}`, { error });
        return fallback;
      }
      await new Promise((resolve) =>
        setTimeout(resolve, PRISMA_POOL_RETRY_DELAY_MS * (attempt + 1))
      );
    }
  }

  return fallback;
}
