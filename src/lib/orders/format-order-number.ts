/**
 * Formats an order number for display (e.g. `1000` → `#1000`).
 * Idempotent when the value is already prefixed.
 */
export function formatOrderNumber(number: string): string {
  const trimmed = number.trim();
  if (!trimmed) {
    return '#';
  }
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}
