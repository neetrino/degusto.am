/** Poll interval for detecting new storefront orders in admin (ms). Paused while tab is hidden. */
export const ADMIN_NEW_ORDER_POLL_INTERVAL_MS = 12_000;

/** Slower poll in local dev to reduce background pool pressure alongside storefront traffic. */
export const ADMIN_NEW_ORDER_POLL_INTERVAL_DEV_MS = 30_000;

export function resolveAdminNewOrderPollIntervalMs(): number {
  if (process.env.NODE_ENV === 'development') {
    return ADMIN_NEW_ORDER_POLL_INTERVAL_DEV_MS;
  }
  return ADMIN_NEW_ORDER_POLL_INTERVAL_MS;
}

/** Dispatched on `window` when a new order is detected (detail: order payload). */
export const ADMIN_NEW_ORDER_EVENT = 'admin-new-order';

export type AdminNewOrderEventDetail = {
  id: string;
  number: string;
  createdAt: string;
};
