'use client';

import { clearShopMenuProductsClientCache } from '@/lib/shop/fetch-shop-menu-products.client';

export const STOREFRONT_CATALOG_UPDATED_EVENT = 'storefront-catalog-updated';

const STOREFRONT_CATALOG_BROADCAST_CHANNEL = 'storefront-catalog';

function getCatalogBroadcastChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') {
    return null;
  }
  return new BroadcastChannel(STOREFRONT_CATALOG_BROADCAST_CHANNEL);
}

/** After admin catalog writes — drop shop client cache and notify open storefront views. */
export function notifyStorefrontCatalogUpdated(): void {
  if (typeof window === 'undefined') {
    return;
  }

  clearShopMenuProductsClientCache();
  window.dispatchEvent(new Event(STOREFRONT_CATALOG_UPDATED_EVENT));

  const channel = getCatalogBroadcastChannel();
  if (channel) {
    channel.postMessage({ type: 'updated' });
    channel.close();
  }
}

/** Listen for catalog invalidation (same tab + other tabs). */
export function subscribeStorefrontCatalogUpdated(onUpdated: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handleUpdate = () => {
    clearShopMenuProductsClientCache();
    onUpdated();
  };

  window.addEventListener(STOREFRONT_CATALOG_UPDATED_EVENT, handleUpdate);

  const channel = getCatalogBroadcastChannel();
  channel?.addEventListener('message', handleUpdate);

  return () => {
    window.removeEventListener(STOREFRONT_CATALOG_UPDATED_EVENT, handleUpdate);
    channel?.removeEventListener('message', handleUpdate);
    channel?.close();
  };
}
