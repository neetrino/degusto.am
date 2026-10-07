/** Yerevan-local delivery schedule used by admin settings and checkout slots. */

export const DELIVERY_SCHEDULE_TIME_ZONE = "Asia/Yerevan";

export const DELIVERY_WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type DeliveryWeekday = (typeof DELIVERY_WEEKDAYS)[number];

export type DeliveryDayHours = {
  open: boolean;
  /** Local wall-clock `HH:mm` (inclusive). */
  start: string;
  /** Local wall-clock `HH:mm` (exclusive upper bound for slots). */
  end: string;
};

export type DeliverySchedule = {
  slotIntervalMinutes: number;
  bookingDaysAhead: number;
  week: Record<DeliveryWeekday, DeliveryDayHours>;
  /** Local calendar dates `YYYY-MM-DD` when delivery is closed. */
  closedDates: string[];
};

export type DeliveryTimeSlot = {
  start: string;
  end: string;
};

export type DeliveryCalendarDay = {
  date: string;
  weekday: DeliveryWeekday;
  available: boolean;
};

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const WEEKDAY_FROM_JS: DeliveryWeekday[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function defaultDay(open: boolean): DeliveryDayHours {
  return { open, start: "10:00", end: "22:00" };
}

export const DEFAULT_DELIVERY_SCHEDULE: DeliverySchedule = {
  slotIntervalMinutes: 60,
  bookingDaysAhead: 7,
  week: {
    monday: defaultDay(true),
    tuesday: defaultDay(true),
    wednesday: defaultDay(true),
    thursday: defaultDay(true),
    friday: defaultDay(true),
    saturday: defaultDay(true),
    sunday: defaultDay(false),
  },
  closedDates: [],
};

function readPart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): number {
  const raw = parts.find((part) => part.type === type)?.value;
  if (raw == null || raw === "") {
    throw new Error(`Missing ${type} for ${DELIVERY_SCHEDULE_TIME_ZONE}`);
  }
  const value = Number(raw);
  if (!Number.isInteger(value)) {
    throw new Error(`Invalid ${type}: ${raw}`);
  }
  return value;
}

/** Local calendar parts in the delivery timezone. */
export function zonedDateParts(
  now: Date,
  timeZone: string = DELIVERY_SCHEDULE_TIME_ZONE,
): { year: number; month: number; day: number; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);

  const hour = readPart(parts, "hour");
  return {
    year: readPart(parts, "year"),
    month: readPart(parts, "month"),
    day: readPart(parts, "day"),
    hour: hour === 24 ? 0 : hour,
    minute: readPart(parts, "minute"),
  };
}

export function formatZonedDate(
  now: Date,
  timeZone: string = DELIVERY_SCHEDULE_TIME_ZONE,
): string {
  const { year, month, day } = zonedDateParts(now, timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseTimeToMinutes(value: string): number | null {
  const match = TIME_RE.exec(value);
  if (!match) {
    return null;
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

function minutesToTime(total: number): string {
  const hour = Math.floor(total / 60);
  const minute = total % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function isValidTime(value: unknown): value is string {
  return typeof value === "string" && TIME_RE.test(value);
}

function isValidDate(value: unknown): value is string {
  return typeof value === "string" && DATE_RE.test(value);
}

function parseIsoDateParts(date: string): {
  year: number;
  month: number;
  day: number;
} {
  const [yearRaw, monthRaw, dayRaw] = date.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    throw new Error(`Invalid date: ${date}`);
  }
  return { year, month, day };
}

function addCalendarDays(date: string, days: number): string {
  const { year, month, day } = parseIsoDateParts(date);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  return `${utc.getUTCFullYear()}-${String(utc.getUTCMonth() + 1).padStart(2, "0")}-${String(utc.getUTCDate()).padStart(2, "0")}`;
}

/** JS weekday for a `YYYY-MM-DD` interpreted as a calendar date (not UTC shift). */
export function weekdayForDate(date: string): DeliveryWeekday {
  const { year, month, day } = parseIsoDateParts(date);
  const jsDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return WEEKDAY_FROM_JS[jsDay] ?? "monday";
}

/**
 * Instant for local `YYYY-MM-DD` + `HH:mm` in Asia/Yerevan.
 * Uses a fixed +04:00 offset (Yerevan has no DST).
 */
export function zonedDateTimeToUtc(date: string, time: string): Date {
  return new Date(`${date}T${time}:00+04:00`);
}

function parseDayHours(value: unknown): DeliveryDayHours {
  if (!value || typeof value !== "object") {
    return defaultDay(false);
  }
  const record = value as Record<string, unknown>;
  const start = isValidTime(record.start) ? record.start : "10:00";
  const end = isValidTime(record.end) ? record.end : "22:00";
  const startMin = parseTimeToMinutes(start) ?? 0;
  const endMin = parseTimeToMinutes(end) ?? 0;
  return {
    open: record.open === true && endMin > startMin,
    start,
    end,
  };
}

/** Parses store setting JSON into a validated schedule (falls back to defaults). */
export function parseDeliverySchedule(value: unknown): DeliverySchedule {
  if (!value || typeof value !== "object") {
    return structuredClone(DEFAULT_DELIVERY_SCHEDULE);
  }

  const record = value as Record<string, unknown>;
  const intervalRaw = Number(record.slotIntervalMinutes);
  const bookingRaw = Number(record.bookingDaysAhead);
  const slotIntervalMinutes =
    Number.isInteger(intervalRaw) && intervalRaw >= 15 && intervalRaw <= 240
      ? intervalRaw
      : DEFAULT_DELIVERY_SCHEDULE.slotIntervalMinutes;
  const bookingDaysAhead =
    Number.isInteger(bookingRaw) && bookingRaw >= 1 && bookingRaw <= 30
      ? bookingRaw
      : DEFAULT_DELIVERY_SCHEDULE.bookingDaysAhead;

  const weekSource =
    record.week && typeof record.week === "object"
      ? (record.week as Record<string, unknown>)
      : {};

  const week = {} as Record<DeliveryWeekday, DeliveryDayHours>;
  for (const day of DELIVERY_WEEKDAYS) {
    week[day] = parseDayHours(weekSource[day]);
  }

  const closedRaw = Array.isArray(record.closedDates)
    ? record.closedDates
    : [];
  const closedDates = [
    ...new Set(
      closedRaw.filter(
        (item): item is string => isValidDate(item),
      ),
    ),
  ].sort();

  return {
    slotIntervalMinutes,
    bookingDaysAhead,
    week,
    closedDates,
  };
}

export function isDateClosed(
  schedule: DeliverySchedule,
  date: string,
): boolean {
  return schedule.closedDates.includes(date);
}

export function isDateBookable(
  schedule: DeliverySchedule,
  date: string,
): boolean {
  if (!isValidDate(date) || isDateClosed(schedule, date)) {
    return false;
  }
  const hours = schedule.week[weekdayForDate(date)];
  return hours.open;
}

/** Hourly (or interval) slots for a local calendar day. */
export function listSlotsForDate(
  schedule: DeliverySchedule,
  date: string,
  now: Date = new Date(),
): DeliveryTimeSlot[] {
  if (!isDateBookable(schedule, date)) {
    return [];
  }

  const hours = schedule.week[weekdayForDate(date)];
  const startMin = parseTimeToMinutes(hours.start);
  const endMin = parseTimeToMinutes(hours.end);
  if (startMin == null || endMin == null || endMin <= startMin) {
    return [];
  }

  const interval = schedule.slotIntervalMinutes;
  const today = formatZonedDate(now);
  const nowParts = zonedDateParts(now);
  const nowMinutes = nowParts.hour * 60 + nowParts.minute;

  const slots: DeliveryTimeSlot[] = [];
  for (let cursor = startMin; cursor + interval <= endMin; cursor += interval) {
    if (date === today && cursor <= nowMinutes) {
      continue;
    }
    slots.push({
      start: minutesToTime(cursor),
      end: minutesToTime(cursor + interval),
    });
  }
  return slots;
}

/** Calendar days from today through booking window (inclusive of today). */
export function listCalendarDays(
  schedule: DeliverySchedule,
  now: Date = new Date(),
): DeliveryCalendarDay[] {
  const today = formatZonedDate(now);
  const days: DeliveryCalendarDay[] = [];
  for (let offset = 0; offset < schedule.bookingDaysAhead; offset += 1) {
    const date = addCalendarDays(today, offset);
    const weekday = weekdayForDate(date);
    const available = listSlotsForDate(schedule, date, now).length > 0;
    days.push({ date, weekday, available });
  }
  return days;
}

/**
 * Concrete local window for ASAP delivery: from now through now + interval,
 * when that window still fits inside today's open hours.
 */
export function resolveAsapDeliveryWindow(
  schedule: DeliverySchedule,
  now: Date = new Date(),
): { date: string; start: string; end: string } | null {
  const today = formatZonedDate(now);
  if (!isDateBookable(schedule, today)) {
    return null;
  }
  const hours = schedule.week[weekdayForDate(today)];
  const dayStart = parseTimeToMinutes(hours.start);
  const dayEnd = parseTimeToMinutes(hours.end);
  if (dayStart == null || dayEnd == null) {
    return null;
  }
  const parts = zonedDateParts(now);
  const nowMin = parts.hour * 60 + parts.minute;
  if (nowMin < dayStart || nowMin >= dayEnd) {
    return null;
  }
  const windowEnd = nowMin + schedule.slotIntervalMinutes;
  if (windowEnd > dayEnd) {
    return null;
  }
  return {
    date: today,
    start: minutesToTime(nowMin),
    end: minutesToTime(windowEnd),
  };
}

/** Whether ASAP delivery is currently offered. */
export function isAsapDeliveryAvailable(
  schedule: DeliverySchedule,
  now: Date = new Date(),
): boolean {
  return resolveAsapDeliveryWindow(schedule, now) !== null;
}

export function isValidDeliverySlot(
  schedule: DeliverySchedule,
  date: string,
  start: string,
  end: string,
  now: Date = new Date(),
): boolean {
  return listSlotsForDate(schedule, date, now).some(
    (slot) => slot.start === start && slot.end === end,
  );
}

/** Human interval label unit for i18n templates. */
export function asapIntervalLabelParts(intervalMinutes: number): {
  kind: "hours" | "minutes";
  value: number;
} {
  if (intervalMinutes % 60 === 0) {
    return { kind: "hours", value: intervalMinutes / 60 };
  }
  return { kind: "minutes", value: intervalMinutes };
}
