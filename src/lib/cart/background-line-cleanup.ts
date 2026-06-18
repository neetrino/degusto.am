import { apiClient } from '@/lib/api-client';
import { ApiError } from '@/lib/api-client/types';
import type { Cart, CartItem } from '@/app/cart/types';
import { logger } from '@/lib/utils/logger';
import { buildCartLineRemovalKey, isOptimisticCartItemId } from '@/lib/cart/pending-cart-removals';
import {
  normalizeProductCustomizations,
  serializeProductCustomizations,
} from '@/lib/cart/customizations';
import { normalizeCartApiResponse } from '@/lib/cart/cart-client-normalization';

const BACKGROUND_DELETE_MAX_ATTEMPTS = 4;
const BACKGROUND_DELETE_BASE_DELAY_MS = 180;
const BACKGROUND_DELETE_TIMEOUT_MS = 8_000;
const BACKGROUND_DELETE_RETRY_COOLDOWN_MS = 15_000;

const inFlightDeletesByKey = new Map<string, Promise<void>>();
const failedDeletesByKey = new Map<
  string,
  { failedAt: number; message: string; status: number | null }
>();

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isCartItemNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof DOMException && error.name === 'AbortError'
  ) || (error instanceof Error && error.name === 'AbortError');
}

function resolveProductId(item: CartItem): string | null {
  const productId = item.variant.product?.id;
  if (!productId || productId.trim().length === 0) {
    return null;
  }
  return productId;
}

function isConcreteVariantId(variantId: string): boolean {
  return !variantId.startsWith('pending:');
}

function buildProductCustomizationKey(item: CartItem): string | null {
  const productId = resolveProductId(item);
  if (!productId) {
    return null;
  }
  const normalizedCustomizations = normalizeProductCustomizations(item.customizations);
  return `${productId}::${serializeProductCustomizations(normalizedCustomizations)}`;
}

function resolveDeleteCandidates(
  serverCart: Cart,
  removedItem: CartItem,
  preferredServerItemId?: string
): CartItem[] {
  const lineKey = buildCartLineRemovalKey(removedItem);
  const canUseProductFallback = isConcreteVariantId(removedItem.variant.id);
  const productCustomizationKey = canUseProductFallback
    ? buildProductCustomizationKey(removedItem)
    : null;

  const matches = serverCart.items.filter((serverItem) => {
    if (isOptimisticCartItemId(serverItem.id)) {
      return false;
    }

    if (buildCartLineRemovalKey(serverItem) === lineKey) {
      return true;
    }

    if (!productCustomizationKey) {
      return false;
    }

    const serverProductCustomizationKey = buildProductCustomizationKey(serverItem);
    return serverProductCustomizationKey === productCustomizationKey;
  });

  if (!preferredServerItemId) {
    return matches;
  }

  const preferredMatch = matches.find((match) => match.id === preferredServerItemId);
  return preferredMatch ? [preferredMatch] : [];
}

export async function deleteMatchingCartLineInBackground(
  item: CartItem,
  preferredServerItemId?: string
): Promise<void> {
  const cleanupKey = buildCartLineRemovalKey(item);
  const failedRecord = failedDeletesByKey.get(cleanupKey);
  if (failedRecord && Date.now() - failedRecord.failedAt < BACKGROUND_DELETE_RETRY_COOLDOWN_MS) {
    return;
  }

  const inFlight = inFlightDeletesByKey.get(cleanupKey);
  if (inFlight) {
    return inFlight;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BACKGROUND_DELETE_TIMEOUT_MS);

  const cleanupTask = (async () => {
    try {
      for (let attempt = 0; attempt < BACKGROUND_DELETE_MAX_ATTEMPTS; attempt += 1) {
        const response = await apiClient.get<unknown>('/api/v1/cart', {
          signal: controller.signal,
          timeoutMs: BACKGROUND_DELETE_TIMEOUT_MS,
        });
        const serverCart = normalizeCartApiResponse(response);
        if (serverCart.items.length === 0) {
          failedDeletesByKey.delete(cleanupKey);
          return;
        }

        const matches = resolveDeleteCandidates(serverCart, item, preferredServerItemId);
        if (matches.length > 0) {
          await Promise.all(
            matches.map(async (match) => {
              await apiClient.delete(`/api/v1/cart/items/${match.id}`, {
                signal: controller.signal,
              });
            })
          );
          failedDeletesByKey.delete(cleanupKey);
          return;
        }

        if (attempt < BACKGROUND_DELETE_MAX_ATTEMPTS - 1) {
          await delay(BACKGROUND_DELETE_BASE_DELAY_MS * (attempt + 1));
        }
      }

      logger.debug('Background cart line cleanup skipped: no confirmed server match', {
        cleanupKey,
        preferredServerItemId: preferredServerItemId ?? null,
      });
      failedDeletesByKey.set(cleanupKey, {
        failedAt: Date.now(),
        message: 'no-confirmed-server-match',
        status: null,
      });
    } catch (error: unknown) {
      if (isCartItemNotFound(error)) {
        failedDeletesByKey.delete(cleanupKey);
        return;
      }

      const status = error instanceof ApiError ? error.status : null;
      const message = error instanceof Error ? error.message : String(error);

      failedDeletesByKey.set(cleanupKey, {
        failedAt: Date.now(),
        message,
        status,
      });

      if (isAbortError(error)) {
        logger.debug('Background cart line cleanup aborted', {
          cleanupKey,
          preferredServerItemId: preferredServerItemId ?? null,
        });
        return;
      }

      logger.warn('Background cart line delete failed', {
        cleanupKey,
        preferredServerItemId: preferredServerItemId ?? null,
        status,
        transient: status !== null && status >= 500,
        error: message,
      });
    } finally {
      clearTimeout(timeoutId);
      inFlightDeletesByKey.delete(cleanupKey);
    }
  })();

  inFlightDeletesByKey.set(cleanupKey, cleanupTask);
  return cleanupTask;
}
