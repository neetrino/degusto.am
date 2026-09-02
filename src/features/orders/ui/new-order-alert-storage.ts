const ACKED_AT_STORAGE_KEY = "degusto.admin.orderAlert.ackedAt";

/** Reads the last-acknowledged watermark, or null when unset. */
export function readOrderAlertAckedAt(): string | null {
  try {
    const value = window.localStorage.getItem(ACKED_AT_STORAGE_KEY);
    if (!value || Number.isNaN(Date.parse(value))) {
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

/** Persists the acknowledged watermark as an ISO timestamp. */
export function writeOrderAlertAckedAt(iso: string): void {
  try {
    window.localStorage.setItem(ACKED_AT_STORAGE_KEY, iso);
  } catch {
    // Ignore quota / private-mode failures; next poll re-baselines.
  }
}

/**
 * Ensures a baseline watermark exists so historical PENDING orders
 * do not flood the first staff session with alerts.
 */
export function ensureOrderAlertBaseline(): string {
  const existing = readOrderAlertAckedAt();
  if (existing) {
    return existing;
  }
  const now = new Date().toISOString();
  writeOrderAlertAckedAt(now);
  return now;
}
