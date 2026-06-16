const HY_AM_DATE_FORMATTER = new Intl.DateTimeFormat('hy-AM', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'UTC',
});

const HY_AM_DATE_TIME_FORMATTER = new Intl.DateTimeFormat('hy-AM', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
});

function parseIsoDate(value: string): Date | null {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) {
    return null;
  }
  return parsed;
}

/**
 * Stable date format for SSR/CSR hydration safety.
 * Uses fixed locale + UTC timezone to avoid environment-dependent rendering.
 */
export function formatHydrationSafeDate(value: string): string {
  const parsed = parseIsoDate(value);
  if (!parsed) {
    return value;
  }
  return HY_AM_DATE_FORMATTER.format(parsed);
}

/**
 * Stable date-time format for SSR/CSR hydration safety.
 * Uses fixed locale + UTC timezone to avoid environment-dependent rendering.
 */
export function formatHydrationSafeDateTime(value: string): string {
  const parsed = parseIsoDate(value);
  if (!parsed) {
    return value;
  }
  return HY_AM_DATE_TIME_FORMATTER.format(parsed);
}
