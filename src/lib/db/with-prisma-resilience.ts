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

function shouldRethrowDatabaseConnectionError(): boolean {
  if (isNextBuildWithoutDbEnv()) {
    return false;
  }
  return process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
}

/**
 * Runs a Prisma-backed operation with retries on pool timeouts.
 * Connection failures rethrow in production/Vercel runtime (error boundary / logs) instead of silent empty UI.
 * Next.js production builds without a real DATABASE_URL use empty fallbacks so CI/`next build` can finish.
 * Local development without Postgres may also use fallbacks when not in production runtime.
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
      if (isPrismaPoolTimeout(error)) {
        const isLastAttempt = attempt === PRISMA_POOL_RETRY_ATTEMPTS;
        logger.warn(`[${scope}] Prisma connection pool timeout in ${step}`, {
          attempt: attempt + 1,
          maxAttempts: PRISMA_POOL_RETRY_ATTEMPTS + 1,
        });
        if (isLastAttempt) {
          logger.error(`[${scope}] Falling back after repeated pool timeouts in ${step}`, { error });
          if (shouldRethrowDatabaseConnectionError()) {
            throw error;
          }
          return fallback;
        }
        await new Promise((resolve) =>
          setTimeout(resolve, PRISMA_POOL_RETRY_DELAY_MS * (attempt + 1))
        );
        continue;
      }
      if (isPrismaConnectionError(error)) {
        const code =
          error instanceof Prisma.PrismaClientKnownRequestError ? error.code : 'initialization';
        logger.error(`[${scope}] Database unreachable in ${step}`, {
          code,
          nodeEnv: process.env.NODE_ENV,
          vercel: process.env.VERCEL === '1',
        });
        if (shouldRethrowDatabaseConnectionError()) {
          throw error;
        }
        logger.warn(`[${scope}] Using empty fallback for ${step} (development only)`);
        return fallback;
      }
      throw error;
    }
  }

  return fallback;
}
