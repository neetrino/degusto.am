/** Armenia business timezone: fixed UTC+4 (Asia/Yerevan, no DST). */
export const APP_TIMEZONE = "Asia/Yerevan";
export const APP_UTC_OFFSET_HOURS = 4;
export const APP_UTC_OFFSET_MS = APP_UTC_OFFSET_HOURS * 60 * 60 * 1000;

export type AppZonedParts = {
  year: number;
  /** 0-based month, matching `Date#getUTCMonth`. */
  monthIndex: number;
  day: number;
};

function toDate(value: Date | string | number): Date {
  return value instanceof Date ? value : new Date(value);
}

function assertValidDate(date: Date): Date {
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }
  return date;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function parseIsoDate(isoDate: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) {
    throw new Error(`Invalid ISO date: ${isoDate}`);
  }
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

/**
 * Calendar parts in the app display timezone (UTC+4).
 * Uses a fixed offset so SSR and every client hydrate identically.
 */
export function toAppZonedParts(
  value: Date | string | number,
): AppZonedParts {
  const shifted = new Date(
    assertValidDate(toDate(value)).getTime() + APP_UTC_OFFSET_MS,
  );
  return {
    year: shifted.getUTCFullYear(),
    monthIndex: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
  };
}

/** YYYY-MM-DD in app timezone. */
export function formatAppIsoDate(value: Date | string | number): string {
  const parts = toAppZonedParts(value);
  return `${parts.year}-${pad2(parts.monthIndex + 1)}-${pad2(parts.day)}`;
}

/** Inclusive start of a YYYY-MM-DD calendar day in app timezone, as UTC. */
export function appDayStartUtc(isoDate: string): Date {
  const { year, month, day } = parseIsoDate(isoDate);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - APP_UTC_OFFSET_MS);
}

/** Inclusive end of a YYYY-MM-DD calendar day in app timezone, as UTC. */
export function appDayEndUtc(isoDate: string): Date {
  const { year, month, day } = parseIsoDate(isoDate);
  return new Date(
    Date.UTC(year, month - 1, day, 23, 59, 59, 999) - APP_UTC_OFFSET_MS,
  );
}
