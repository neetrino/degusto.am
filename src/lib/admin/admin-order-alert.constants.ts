/** Poll interval for detecting new storefront orders in admin (ms). */
export const ADMIN_NEW_ORDER_POLL_INTERVAL_MS = 12_000;

/** Dispatched on `window` when a new order is detected (detail: order payload). */
export const ADMIN_NEW_ORDER_EVENT = 'admin-new-order';

export type AdminNewOrderEventDetail = {
  id: string;
  number: string;
  createdAt: string;
};
