import type { Currency } from "@/lib/money/currency";
import { getCurrencyMeta } from "@/lib/money/currency-meta";

/** Dot thousands grouping for AMD (10.000). Thin space for FX to keep `.` decimals. */
const AMD_GROUP_SEPARATOR = ".";
const FX_GROUP_SEPARATOR = "\u202f";
const AMD_GROUP_FROM = 10_000;

/**
 * Formats a whole number with `.` thousands separators from 10.000 up.
 * Values below 10.000 stay ungrouped (20, 1800, 9999).
 */
export function formatGroupedInteger(value: number | bigint): string {
  const raw = typeof value === "bigint" ? Number(value) : value;
  if (!Number.isFinite(raw)) {
    throw new Error("Money amount is not finite");
  }

  const rounded = Math.round(raw);
  const sign = rounded < 0 ? "-" : "";
  const absolute = Math.abs(rounded);
  if (absolute < AMD_GROUP_FROM) {
    return `${sign}${String(absolute)}`;
  }
  return `${sign}${String(absolute).replace(/\B(?=(\d{3})+(?!\d))/g, AMD_GROUP_SEPARATOR)}`;
}

/**
 * Formats the major-unit number without Intl currency style.
 * Avoids SSR/client hydration mismatches from ICU differences (e.g. hy + AMD).
 */
function formatMajorAmount(
  major: number,
  fractionDigits: number,
  groupSeparator: string,
): string {
  const sign = major < 0 ? "-" : "";
  const absolute = Math.abs(major);
  const [integerPart = "0", fractionPart] = absolute
    .toFixed(fractionDigits)
    .split(".");
  const integerValue = Number(integerPart);
  const shouldGroup =
    groupSeparator !== AMD_GROUP_SEPARATOR || integerValue >= AMD_GROUP_FROM;
  const grouped = shouldGroup
    ? integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator)
    : integerPart;

  if (fractionDigits > 0 && fractionPart !== undefined) {
    return `${sign}${grouped}.${fractionPart}`;
  }

  return `${sign}${grouped}`;
}

/** Formats an integer minor-unit amount with a stable currency code suffix. */
export function formatMoneyAmount(
  amount: bigint | number,
  currency: Currency,
  locale: string,
): string {
  void locale;
  const meta = getCurrencyMeta(currency);
  const raw = typeof amount === "bigint" ? Number(amount) : amount;

  if (!Number.isFinite(raw)) {
    throw new Error("Money amount is not finite");
  }

  const major = raw / 10 ** meta.scale;
  const groupSeparator =
    currency === "AMD" ? AMD_GROUP_SEPARATOR : FX_GROUP_SEPARATOR;
  return `${formatMajorAmount(major, meta.fractionDigits, groupSeparator)} ${currency}`;
}

type StorefrontPriceInput = {
  displayCurrency: Currency;
  displayAmount: bigint | number;
  formatted: string;
};

/** Storefront price label: AMD uses `10.000 Դ` grouping, other currencies keep `formatted`. */
export function formatStorefrontPrice(price: StorefrontPriceInput): string {
  if (price.displayCurrency === "AMD") {
    return `${formatGroupedInteger(price.displayAmount)} Դ`;
  }
  return price.formatted;
}
