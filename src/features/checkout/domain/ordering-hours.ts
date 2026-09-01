/** Storefront order window, matching the legacy PHP check in Yerevan time. */
export const ORDERING_TIME_ZONE = "Asia/Yerevan";

export const ORDERING_OPENS_AT = {
  hour: 9,
  minute: 0,
  second: 0,
} as const;

/** First closed second of the calendar day (legacy used `>= 23:59`). */
export const ORDERING_CLOSES_AT = {
  hour: 23,
  minute: 59,
  second: 0,
} as const;

type ClockTime = {
  hour: number;
  minute: number;
  second: number;
};

function readPart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
  timeZone: string,
): number {
  const raw = parts.find((part) => part.type === type)?.value;
  if (raw == null || raw === "") {
    throw new Error(`Missing ${type} for ${timeZone}`);
  }
  const value = Number(raw);
  if (!Number.isInteger(value)) {
    throw new Error(`Invalid ${type} for ${timeZone}: ${raw}`);
  }
  return value;
}

function clockInTimeZone(now: Date, timeZone: string): ClockTime {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);

  const hour = readPart(parts, "hour", timeZone);
  return {
    hour: hour === 24 ? 0 : hour,
    minute: readPart(parts, "minute", timeZone),
    second: readPart(parts, "second", timeZone),
  };
}

function secondOfDay(clock: ClockTime): number {
  return clock.hour * 3600 + clock.minute * 60 + clock.second;
}

/**
 * Whether a new storefront order may be placed at `now`.
 * Open from 09:00:00 inclusive through 23:58:59 inclusive (`Asia/Yerevan`).
 */
export function isOrderingOpen(
  now: Date,
  timeZone: string = ORDERING_TIME_ZONE,
): boolean {
  const current = secondOfDay(clockInTimeZone(now, timeZone));
  return (
    current >= secondOfDay(ORDERING_OPENS_AT) &&
    current < secondOfDay(ORDERING_CLOSES_AT)
  );
}
