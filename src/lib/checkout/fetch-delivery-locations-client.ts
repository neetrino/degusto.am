'use client';

import { apiClient } from '@/lib/api-client';
import { createInflightGetCache } from '@/lib/admin/inflight-get-cache';

export type DeliveryLocationsPayload = {
  cities: string[];
};

export const DELIVERY_LOCATIONS_UPDATED_EVENT = 'delivery-locations-updated';

const DELIVERY_LOCATIONS_SESSION_KEY = 'degusto_delivery_cities_v1';
const DELIVERY_LOCATIONS_CLIENT_TTL_MS = 24 * 60 * 60 * 1000;
const DELIVERY_LOCATIONS_BROADCAST_CHANNEL = 'delivery-locations';

const deliveryLocationsCache = createInflightGetCache<DeliveryLocationsPayload>(
  DELIVERY_LOCATIONS_CLIENT_TTL_MS
);

type SessionEntry = {
  data: DeliveryLocationsPayload;
  updatedAt: number;
};

function getDeliveryBroadcastChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') {
    return null;
  }
  return new BroadcastChannel(DELIVERY_LOCATIONS_BROADCAST_CHANNEL);
}

function readSessionCache(): DeliveryLocationsPayload | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(DELIVERY_LOCATIONS_SESSION_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as SessionEntry;
    if (Date.now() - parsed.updatedAt > DELIVERY_LOCATIONS_CLIENT_TTL_MS) {
      window.sessionStorage.removeItem(DELIVERY_LOCATIONS_SESSION_KEY);
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

function writeSessionCache(data: DeliveryLocationsPayload): void {
  if (typeof window === 'undefined') {
    return;
  }

  const entry: SessionEntry = { data, updatedAt: Date.now() };
  window.sessionStorage.setItem(DELIVERY_LOCATIONS_SESSION_KEY, JSON.stringify(entry));
}

export function invalidateDeliveryLocationsClientCache(): void {
  deliveryLocationsCache.invalidate();
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(DELIVERY_LOCATIONS_SESSION_KEY);
  }
}

/** After admin delivery save — clear client cache and notify open checkout tabs (same + other tabs). */
export function notifyDeliveryLocationsUpdated(): void {
  if (typeof window === 'undefined') {
    return;
  }

  invalidateDeliveryLocationsClientCache();
  window.dispatchEvent(new Event(DELIVERY_LOCATIONS_UPDATED_EVENT));

  const channel = getDeliveryBroadcastChannel();
  if (channel) {
    channel.postMessage({ type: 'updated' });
    channel.close();
  }
}

/** Listen for delivery location invalidation (same tab + other tabs). */
export function subscribeDeliveryLocationsUpdated(onUpdated: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handleUpdate = () => {
    invalidateDeliveryLocationsClientCache();
    onUpdated();
  };

  window.addEventListener(DELIVERY_LOCATIONS_UPDATED_EVENT, handleUpdate);

  const channel = getDeliveryBroadcastChannel();
  channel?.addEventListener('message', handleUpdate);

  return () => {
    window.removeEventListener(DELIVERY_LOCATIONS_UPDATED_EVENT, handleUpdate);
    channel?.removeEventListener('message', handleUpdate);
    channel?.close();
  };
}

type FetchDeliveryLocationsOptions = {
  /** Bypass session/in-memory cache and refetch from API. */
  forceDirect?: boolean;
};

/**
 * Public delivery cities — sessionStorage + in-flight dedupe (24h TTL).
 */
export async function fetchDeliveryLocationsCached(
  options?: FetchDeliveryLocationsOptions
): Promise<DeliveryLocationsPayload> {
  if (options?.forceDirect) {
    invalidateDeliveryLocationsClientCache();
  } else {
    const session = readSessionCache();
    if (session) {
      deliveryLocationsCache.seed(session);
      return session;
    }
  }

  const data = await deliveryLocationsCache.fetch(() =>
    apiClient.get<DeliveryLocationsPayload>('/api/v1/delivery/locations')
  );
  writeSessionCache(data);
  return data;
}
