import { z } from "zod";

/** Canonical payment methods shown in admin analytics. */
export const ANALYTICS_PAYMENT_METHODS = ["cash", "idram", "arca"] as const;

export type AnalyticsPaymentMethod =
  (typeof ANALYTICS_PAYMENT_METHODS)[number];

export const ANALYTICS_PAYMENT_METHOD_FILTERS = [
  "all",
  ...ANALYTICS_PAYMENT_METHODS,
] as const;

export type AnalyticsPaymentMethodFilter =
  (typeof ANALYTICS_PAYMENT_METHOD_FILTERS)[number];

export const analyticsPaymentMethodFilterSchema = z.enum(
  ANALYTICS_PAYMENT_METHOD_FILTERS,
);

/** Legacy + current `payments.method` values that map to cash. */
export const CASH_PAYMENT_METHOD_ALIASES = ["cash", "cod", "cache"] as const;

const FILTER_LABELS: Record<AnalyticsPaymentMethodFilter, string> = {
  all: "Բոլորը",
  cash: "Cash",
  idram: "Idram",
  arca: "Arca",
};

/** Human label for the analytics payment filter select. */
export function analyticsPaymentMethodFilterLabel(
  filter: AnalyticsPaymentMethodFilter,
): string {
  return FILTER_LABELS[filter];
}

/** DB method values that match a canonical analytics payment method. */
export function paymentMethodDbAliases(
  method: AnalyticsPaymentMethod,
): readonly string[] {
  if (method === "cash") {
    return CASH_PAYMENT_METHOD_ALIASES;
  }
  return [method];
}

/**
 * Maps a raw `payments.method` value to a canonical analytics bucket.
 * Unknown / missing methods become `other`.
 */
export function normalizeAnalyticsPaymentMethod(
  method: string | null | undefined,
): AnalyticsPaymentMethod | "other" {
  if (!method || method.trim().length === 0) {
    return "other";
  }

  const normalized = method.trim().toLowerCase();
  if (
    (CASH_PAYMENT_METHOD_ALIASES as readonly string[]).includes(normalized)
  ) {
    return "cash";
  }
  if (normalized === "idram") {
    return "idram";
  }
  if (normalized === "arca") {
    return "arca";
  }
  return "other";
}

/** Parses a search-param value; invalid input falls back to `all`. */
export function parseAnalyticsPaymentMethodFilter(
  value: string | undefined,
): AnalyticsPaymentMethodFilter {
  const parsed = analyticsPaymentMethodFilterSchema.safeParse(value);
  return parsed.success ? parsed.data : "all";
}
