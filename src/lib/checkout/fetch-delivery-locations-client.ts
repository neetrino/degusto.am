'use client';

import { apiClient } from '@/lib/api-client';
import { createInflightGetCache } from '@/lib/admin/inflight-get-cache';

export type DeliveryLocationsPayload = {
  cities: string[];
};

const DELIVERY_LOCATIONS_SESSION_KEY = 'degusto_delivery_cities_v1';
const DELIVERY_LOCATIONS_CLIENT_TTL_MS = 24 * 60 * 60 * 1000;

const deliveryLocationsCache = createInflightGetCache<DeliveryLocationsPayload>(
  DELIVERY_LOCATIONS_CLIENT_TTL_MS
);

type SessionEntry = {
  data: DeliveryLocationsPayload;
  updatedAt: number;
};

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

/**
 * Public delivery cities — sessionStorage + in-flight dedupe (24h TTL).
 */
export async function fetchDeliveryLocationsCached(): Promise<DeliveryLocationsPayload> {
  const session = readSessionCache();
  if (session) {
    deliveryLocationsCache.seed(session);
    return session;
  }

  const data = await deliveryLocationsCache.fetch(() =>
    apiClient.get<DeliveryLocationsPayload>('/api/v1/delivery/locations')
  );
  writeSessionCache(data);
  return data;
}
