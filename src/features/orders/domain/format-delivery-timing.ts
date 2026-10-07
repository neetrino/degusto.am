import { zonedDateParts } from "@/features/delivery/domain/delivery-schedule";
import type { Locale } from "@/lib/i18n/config";

const MONTH_NAMES: Record<Locale, readonly string[]> = {
  hy: [
    "հունվար",
    "փետրվար",
    "մարտ",
    "ապրիլ",
    "մայիս",
    "հունիս",
    "հուլիս",
    "օգոստոս",
    "սեպտեմբեր",
    "հոկտեմբեր",
    "նոյեմբեր",
    "դեկտեմբեր",
  ],
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  ru: [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ],
};

const SNAPSHOT_SLOT_RE =
  /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})[–-](\d{2}:\d{2})$/;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function formatClock(hour: number, minute: number): string {
  return `${pad2(hour)}:${pad2(minute)}`;
}

function formatDateLabel(
  year: number,
  month: number,
  day: number,
  locale: Locale,
): string {
  const monthName = MONTH_NAMES[locale][month - 1] ?? String(month);
  if (locale === "en") {
    return `${monthName} ${day}, ${year}`;
  }
  return `${day} ${monthName} ${year}`;
}

function formatRangeLabel(start: Date, end: Date, locale: Locale): string {
  const startParts = zonedDateParts(start);
  const endParts = zonedDateParts(end);
  const dateLabel = formatDateLabel(
    startParts.year,
    startParts.month,
    startParts.day,
    locale,
  );
  return `${dateLabel} · ${formatClock(startParts.hour, startParts.minute)}–${formatClock(endParts.hour, endParts.minute)}`;
}

/** Parses legacy ASAP copy like "մոտավորապես 90 րոպեում" / "approximately in 1 hour(s)". */
export function parseApproxIntervalMinutes(snapshot: string): number | null {
  const minutesMatch = snapshot.match(/(\d+)\s*(րոպե|мин|minute)/i);
  if (minutesMatch) {
    const value = Number(minutesMatch[1]);
    return Number.isInteger(value) && value > 0 ? value : null;
  }
  const hoursMatch = snapshot.match(/(\d+(?:[.,]\d+)?)\s*(ժամ|ч\.?|hour)/i);
  if (hoursMatch) {
    const value = Number(hoursMatch[1]?.replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) {
      return null;
    }
    return Math.round(value * 60);
  }
  return null;
}

type DeliveryTimingSource = {
  locale: string;
  placedAt: Date;
  deliveryEstimateSnapshot: string | null;
  deliverySlotStartAt: Date | null;
  deliverySlotEndAt: Date | null;
};

/**
 * Human label for order delivery date/time.
 * Prefers stored slot timestamps; falls back to snapshot or legacy ASAP text.
 */
export function formatDeliveryTimingLabel(
  source: DeliveryTimingSource,
): string | null {
  const locale: Locale =
    source.locale === "hy" || source.locale === "ru" || source.locale === "en"
      ? source.locale
      : "en";

  if (source.deliverySlotStartAt && source.deliverySlotEndAt) {
    return formatRangeLabel(
      source.deliverySlotStartAt,
      source.deliverySlotEndAt,
      locale,
    );
  }

  const snapshot = source.deliveryEstimateSnapshot?.trim();
  if (!snapshot) {
    return null;
  }

  const slotMatch = SNAPSHOT_SLOT_RE.exec(snapshot);
  if (slotMatch) {
    const date = slotMatch[1];
    const start = slotMatch[2];
    const end = slotMatch[3];
    if (date && start && end) {
      const [yearRaw, monthRaw, dayRaw] = date.split("-");
      const year = Number(yearRaw);
      const month = Number(monthRaw);
      const day = Number(dayRaw);
      if (
        Number.isInteger(year) &&
        Number.isInteger(month) &&
        Number.isInteger(day)
      ) {
        return `${formatDateLabel(year, month, day, locale)} · ${start}–${end}`;
      }
    }
  }

  const approxMinutes = parseApproxIntervalMinutes(snapshot);
  if (approxMinutes != null) {
    const end = new Date(source.placedAt.getTime() + approxMinutes * 60_000);
    return formatRangeLabel(source.placedAt, end, locale);
  }

  return snapshot;
}
