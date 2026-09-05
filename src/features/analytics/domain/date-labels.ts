import { defaultLocale, type Locale } from "@/lib/i18n/config";

const HY_MONTHS_LONG = [
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
] as const;

const HY_MONTHS_SHORT = [
  "հնվ",
  "փտվ",
  "մրտ",
  "ապր",
  "մյս",
  "հնս",
  "հլս",
  "օգս",
  "սեպ",
  "հոկ",
  "նոյ",
  "դեկ",
] as const;

const EN_MONTHS_LONG = [
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
] as const;

const RU_MONTHS_LONG = [
  "январь",
  "февраль",
  "март",
  "апрель",
  "май",
  "июнь",
  "июль",
  "август",
  "сентябрь",
  "октябрь",
  "ноябрь",
  "декабрь",
] as const;

function parseUtcIsoDate(isoDate: string): {
  day: number;
  monthIndex: number;
  year: number;
} {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  return {
    day: date.getUTCDate(),
    monthIndex: date.getUTCMonth(),
    year: date.getUTCFullYear(),
  };
}

/**
 * Formats an ISO date for analytics headers (deterministic Armenian).
 * Avoids Intl locale hydration mismatches between Node and browser.
 */
export function formatAnalyticsDisplayDate(isoDate: string): string {
  const { day, monthIndex, year } = parseUtcIsoDate(isoDate);
  return `${day} ${HY_MONTHS_LONG[monthIndex]}, ${year}`;
}

/**
 * Formats a short chart/list date (deterministic Armenian).
 * Avoids Intl locale hydration mismatches between Node and browser.
 */
export function formatAnalyticsShortDate(isoDate: string): string {
  const { day, monthIndex } = parseUtcIsoDate(isoDate);
  return `${day} ${HY_MONTHS_SHORT[monthIndex]}`;
}

/** Formats YYYY-MM for trend charts without Intl locale drift. */
export function formatAnalyticsMonthLabel(
  yearMonth: string,
  locale: Locale = defaultLocale,
): string {
  const [year, month] = yearMonth.split("-").map(Number) as [number, number];
  const monthIndex = month - 1;
  const names =
    locale === "en"
      ? EN_MONTHS_LONG
      : locale === "ru"
        ? RU_MONTHS_LONG
        : HY_MONTHS_LONG;
  return `${names[monthIndex]} ${year}`;
}
