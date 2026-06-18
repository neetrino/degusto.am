'use client';

import { useCallback, useEffect, useRef, useState, type SetStateAction } from 'react';
import type { Cart, CartItem } from '@/app/cart/types';
import { fetchCart } from '@/app/cart/cart-fetcher';
import { parseCartUpdatedDetail } from '@/lib/cart/cart-events';
import {
  applyOptimisticCartAdd,
  confirmOptimisticCartLine,
  snapshotFromCartDetail,
} from '@/lib/cart/optimistic-cart-add';
import { buildCustomizationLineKey, normalizeProductCustomizations } from '@/lib/cart/customizations';
import { applyRemovedLinesFilter } from '@/lib/cart/pending-cart-removals';
import { dispatchCartSummarySync } from '@/lib/cart/cart-summary-sync';
import { createEmptyCart } from '@/lib/cart/empty-cart';
import { ApiError } from '@/lib/api-client/types';

const CART_RECONCILE_DEBOUNCE_MS = 400;
const CART_OPTIMISTIC_RECONCILE_IDLE_MS = 900;
const CART_RECONCILE_MIN_GAP_MS = 1500;
const CART_SNAPSHOT_CACHE_KEY = 'shop_cart_snapshot_cache';
const CART_SNAPSHOT_MAX_AGE_MS = 1000 * 60 * 5;

type UseCartLiveSyncOptions = {
  isLoggedIn: boolean;
  isAuthLoading: boolean;
  t: (key: string) => string;
};

export type CartSyncState = 'idle' | 'loading' | 'syncing' | 'synced' | 'stale' | 'failed';

export type StableCartState = {
  items: CartItem[];
  total: number;
  status: CartSyncState;
  lastSuccessfulSyncAt: number | null;
  error: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function isCartSnapshotPayload(value: unknown): value is { cart: Cart; updatedAt: number } {
  if (!isRecord(value)) {
    return false;
  }

  const updatedAt = value.updatedAt;
  const cart = value.cart;
  if (typeof updatedAt !== 'number' || !Number.isFinite(updatedAt)) {
    return false;
  }
  if (!isRecord(cart)) {
    return false;
  }

  const items = cart.items;
  const totals = cart.totals;
  return Array.isArray(items) && isRecord(totals) && typeof cart.itemsCount === 'number';
}

function mergeDuplicateCartItems(items: CartItem[]): CartItem[] {
  const merged = new Map<string, CartItem>();
  for (const item of items) {
    const key = buildCustomizationLineKey(
      item.variant.id,
      normalizeProductCustomizations(item.customizations)
    );
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, item);
      continue;
    }
    const quantity = existing.quantity + item.quantity;
    merged.set(key, {
      ...existing,
      total: existing.total + item.total,
      quantity,
    });
  }
  return Array.from(merged.values());
}

function sanitizeCartState(cart: Cart): Cart {
  const mergedItems = mergeDuplicateCartItems(cart.items);
  const itemsCount = mergedItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = mergedItems.reduce((sum, item) => sum + item.total, 0);
  return {
    ...cart,
    items: mergedItems,
    itemsCount,
    totals: {
      ...cart.totals,
      subtotal,
      total: subtotal + cart.totals.tax + cart.totals.shipping - cart.totals.discount,
    },
  };
}

function normalizeCartPayload(cartData: Cart | null): Cart | null {
  const filtered = applyRemovedLinesFilter(cartData);
  return filtered ? sanitizeCartState(filtered) : null;
}

function toCartErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message || `Cart sync failed (${error.status})`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Cart sync failed';
}

function readCartSnapshotCache(): Cart | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(CART_SNAPSHOT_CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isCartSnapshotPayload(parsed)) {
      return null;
    }

    if (Date.now() - parsed.updatedAt > CART_SNAPSHOT_MAX_AGE_MS) {
      return null;
    }

    return normalizeCartPayload(parsed.cart);
  } catch {
    return null;
  }
}

function writeCartSnapshotCache(cart: Cart | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (!cart || cart.itemsCount <= 0 || cart.items.length === 0) {
    window.localStorage.removeItem(CART_SNAPSHOT_CACHE_KEY);
    return;
  }

  window.localStorage.setItem(
    CART_SNAPSHOT_CACHE_KEY,
    JSON.stringify({
      cart,
      updatedAt: Date.now(),
    })
  );
}

function resolveInitialCartState(): Cart | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return readCartSnapshotCache();
}

function buildPendingOptimisticLineKey(input: {
  variantId: string;
  customizations?: Parameters<typeof normalizeProductCustomizations>[0];
}): string {
  return buildCustomizationLineKey(
    input.variantId,
    normalizeProductCustomizations(input.customizations)
  );
}

export function useCartLiveSync({
  isLoggedIn,
  isAuthLoading,
  t,
}: UseCartLiveSyncOptions) {
  const [cart, setCart] = useState<Cart | null>(resolveInitialCartState);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartSyncState, setCartSyncState] = useState<CartSyncState>('idle');
  const [cartError, setCartError] = useState<string | null>(null);
  const [lastSuccessfulSyncAt, setLastSuccessfulSyncAt] = useState<number | null>(null);
  const [isCartResolved, setIsCartResolved] = useState(false);
  const cartRef = useRef<Cart | null>(null);
  const reconcileTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const optimisticReconcileTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reloadGenerationRef = useRef(0);
  const mutationSequenceRef = useRef(0);
  const inFlightReloadRef = useRef<Promise<void> | null>(null);
  const queuedReloadRef = useRef(false);
  const queuedReloadSilentRef = useRef(true);
  const badgeSyncReadyRef = useRef(false);
  const lastReconcileAtRef = useRef(0);
  const pendingOptimisticLinesRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  const applyCart = useCallback((value: SetStateAction<Cart | null>) => {
    badgeSyncReadyRef.current = true;
    setCart(value);
  }, []);

  const commitCartMutation = useCallback(
    (value: SetStateAction<Cart | null>) => {
      mutationSequenceRef.current += 1;
      applyCart(value);
    },
    [applyCart]
  );

  useEffect(() => {
    if (!badgeSyncReadyRef.current) {
      return;
    }
    writeCartSnapshotCache(cart);
    dispatchCartSummarySync(cart);
  }, [cart]);

  const invalidateInFlightReload = useCallback(() => {
    reloadGenerationRef.current += 1;
  }, []);

  const reloadCart = useCallback(
    async (options?: { silent?: boolean }) => {
      if (inFlightReloadRef.current) {
        queuedReloadRef.current = true;
        queuedReloadSilentRef.current = queuedReloadSilentRef.current && (options?.silent ?? false);
        return inFlightReloadRef.current;
      }

      queuedReloadSilentRef.current = true;
      const generation = ++reloadGenerationRef.current;
      const silent = options?.silent ?? false;
      const runReload = async () => {
        setCartSyncState(cartRef.current ? 'syncing' : 'loading');
        setCartError(null);
        if (!silent) {
          setCartLoading(true);
        }
        try {
          const requestMutationSequence = mutationSequenceRef.current;
          const cartData = await fetchCart(isLoggedIn, t);
          if (generation !== reloadGenerationRef.current) {
            return;
          }
          if (requestMutationSequence !== mutationSequenceRef.current) {
            return;
          }
          applyCart(normalizeCartPayload(cartData) ?? createEmptyCart());
          setCartSyncState('synced');
          setLastSuccessfulSyncAt(Date.now());
          setCartError(null);
        } catch (error: unknown) {
          if (generation !== reloadGenerationRef.current) {
            return;
          }
          const snapshotFallback = readCartSnapshotCache();
          // Keep current UI cart as source of truth; fallback only when no state exists at all.
          applyCart((previous) => previous ?? snapshotFallback ?? createEmptyCart());
          setCartSyncState(cartRef.current || snapshotFallback ? 'stale' : 'failed');
          setCartError(toCartErrorMessage(error));
        } finally {
          if (generation === reloadGenerationRef.current) {
            setCartLoading(false);
            setIsCartResolved(true);
            badgeSyncReadyRef.current = true;
          }
        }
      };

      const reloadPromise = runReload().finally(() => {
        inFlightReloadRef.current = null;
        if (queuedReloadRef.current) {
          const queuedSilent = queuedReloadSilentRef.current;
          queuedReloadRef.current = false;
          queuedReloadSilentRef.current = true;
          void reloadCart({ silent: queuedSilent });
        }
      });

      inFlightReloadRef.current = reloadPromise;
      return reloadPromise;
    },
    [applyCart, isLoggedIn, t]
  );

  const scheduleReconcile = useCallback(() => {
    if (reconcileTimerRef.current) {
      clearTimeout(reconcileTimerRef.current);
    }
    reconcileTimerRef.current = setTimeout(() => {
      reconcileTimerRef.current = null;
      void reloadCart({ silent: true });
    }, CART_RECONCILE_DEBOUNCE_MS);
  }, [reloadCart]);

  const scheduleOptimisticBurstReconcile = useCallback(() => {
    if (optimisticReconcileTimerRef.current) {
      clearTimeout(optimisticReconcileTimerRef.current);
    }

    optimisticReconcileTimerRef.current = setTimeout(() => {
      optimisticReconcileTimerRef.current = null;
      if (pendingOptimisticLinesRef.current.size > 0) {
        // Wait until optimistic lines are confirmed to avoid "appear -> disappear -> appear".
        scheduleOptimisticBurstReconcile();
        return;
      }
      const now = Date.now();
      const elapsed = now - lastReconcileAtRef.current;
      if (elapsed < CART_RECONCILE_MIN_GAP_MS) {
        optimisticReconcileTimerRef.current = setTimeout(() => {
          optimisticReconcileTimerRef.current = null;
          lastReconcileAtRef.current = Date.now();
          void reloadCart({ silent: true });
        }, CART_RECONCILE_MIN_GAP_MS - elapsed);
        return;
      }

      lastReconcileAtRef.current = now;
      void reloadCart({ silent: true });
    }, CART_OPTIMISTIC_RECONCILE_IDLE_MS);
  }, [reloadCart]);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }
    setIsCartResolved(false);
    void reloadCart({ silent: true });
  }, [isAuthLoading, isLoggedIn, reloadCart]);

  useEffect(() => {
    const onCartUpdate = (event: Event) => {
      const detail = parseCartUpdatedDetail(event);
      if (!detail) {
        return;
      }

      if (detail.forceReload) {
        mutationSequenceRef.current += 1;
        setCartSyncState('syncing');
        pendingOptimisticLinesRef.current.clear();
        void reloadCart({ silent: true });
        return;
      }

      if (detail.skipReconcile) {
        mutationSequenceRef.current += 1;
        invalidateInFlightReload();
        if (reconcileTimerRef.current) {
          clearTimeout(reconcileTimerRef.current);
          reconcileTimerRef.current = null;
        }
      }

      if (detail.confirmedLine) {
        const confirmedKey = buildPendingOptimisticLineKey({
          variantId: detail.confirmedLine.previousVariantId,
          customizations: detail.confirmedLine.customizations,
        });
        const pendingCount = pendingOptimisticLinesRef.current.get(confirmedKey) ?? 0;
        if (pendingCount <= 1) {
          pendingOptimisticLinesRef.current.delete(confirmedKey);
        } else {
          pendingOptimisticLinesRef.current.set(confirmedKey, pendingCount - 1);
        }

        const nextCart = confirmOptimisticCartLine(cartRef.current, detail.confirmedLine);
        commitCartMutation(nextCart);
        setCartSyncState('synced');
        setCartLoading(false);
        if (nextCart === cartRef.current) {
          // No optimistic row to promote: fetch persisted cart before exposing new line.
          void reloadCart({ silent: true });
          return;
        }
        scheduleOptimisticBurstReconcile();
      }

      const snapshot = snapshotFromCartDetail(detail);
      if (snapshot) {
        const pendingKey = buildPendingOptimisticLineKey({
          variantId: snapshot.variantId,
          customizations: snapshot.customizations,
        });
        pendingOptimisticLinesRef.current.set(
          pendingKey,
          (pendingOptimisticLinesRef.current.get(pendingKey) ?? 0) + 1
        );
        setCartSyncState('syncing');
        commitCartMutation(applyOptimisticCartAdd(cartRef.current, snapshot));
        setCartLoading(false);
        scheduleOptimisticBurstReconcile();
      }

      if (!detail.skipReconcile && detail.itemsCount !== undefined) {
        scheduleReconcile();
      }
    };

    window.addEventListener('cart-updated', onCartUpdate);
    return () => {
      window.removeEventListener('cart-updated', onCartUpdate);
      if (reconcileTimerRef.current) {
        clearTimeout(reconcileTimerRef.current);
      }
      if (optimisticReconcileTimerRef.current) {
        clearTimeout(optimisticReconcileTimerRef.current);
      }
    };
  }, [
    commitCartMutation,
    invalidateInFlightReload,
    scheduleOptimisticBurstReconcile,
    reloadCart,
    scheduleReconcile,
  ]);

  const cartState: StableCartState = {
    items: cart?.items ?? [],
    total: cart?.totals?.total ?? 0,
    status: cartSyncState,
    lastSuccessfulSyncAt,
    error: cartError,
  };

  return {
    cart,
    cartState,
    setCart: commitCartMutation,
    cartLoading,
    cartSyncState,
    isCartResolved,
    setCartLoading,
    reloadCart,
    scheduleReconcile,
    cartRef,
  };
}
