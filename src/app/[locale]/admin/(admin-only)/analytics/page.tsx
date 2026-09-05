import { notFound } from "next/navigation";

import {
  ADMIN_PAGE_SUBTITLE,
  ADMIN_PAGE_TITLE,
} from "@/features/admin/ui/admin-form-classes";
import { getAnalyticsSummary } from "@/features/analytics/application/queries";
import { buildAnalyticsTrendSeries } from "@/features/analytics/domain/dashboard-periods";
import {
  analyticsDateRangeSchema,
  formatAnalyticsShortDate,
  matchAnalyticsPeriodPreset,
  rangeForAnalyticsPeriod,
} from "@/features/analytics/domain/date-range";
import { AnalyticsOverviewCards } from "@/features/analytics/ui/AnalyticsOverviewCards";
import { AnalyticsPeriodCard } from "@/features/analytics/ui/AnalyticsPeriodCard";
import { AnalyticsSelectedRangeCards } from "@/features/analytics/ui/AnalyticsSelectedRangeCards";
import { AnalyticsTopRankings } from "@/features/analytics/ui/AnalyticsTopRankings";
import { AnalyticsTrendPanel } from "@/features/analytics/ui/AnalyticsTrendPanel";
import { isLocale } from "@/lib/i18n/config";
import { formatMoneyAmount } from "@/lib/money/format";

type AdminAnalyticsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function AdminAnalyticsPage({
  params,
  searchParams,
}: AdminAnalyticsPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const raw = await searchParams;
  const defaults = rangeForAnalyticsPeriod("last_7_days");
  const parsed = analyticsDateRangeSchema.safeParse({
    from: firstParam(raw.from) ?? defaults.from,
    to: firstParam(raw.to) ?? defaults.to,
  });

  const range = parsed.success ? parsed.data : defaults;
  const preset = matchAnalyticsPeriodPreset(range);
  const summary = await getAnalyticsSummary({ ...range, locale });
  const exportQuery = new URLSearchParams({
    from: range.from,
    to: range.to,
  }).toString();

  const formatMoney = (amount: number): string =>
    formatMoneyAmount(amount, "AMD", locale);

  const trendPoints = buildAnalyticsTrendSeries(
    summary.dailyRows,
    range,
    locale,
  );
  const chartRows = trendPoints.map((point) => ({
    date: point.key.includes("-") && point.key.length === 7
      ? `${point.key}-01`
      : point.key,
    label: point.label,
    orderCount: point.orderCount,
    revenueAmount: point.revenueAmount,
    averageOrderValue:
      point.orderCount === 0
        ? 0
        : Math.round((point.revenueAmount / point.orderCount) * 100) / 100,
    revenueLabel: formatMoney(point.revenueAmount),
  }));

  return (
    <section>
      <div className="mb-5">
        <h1 className={ADMIN_PAGE_TITLE}>Վերլուծություն</h1>
        <p className={`mt-1 ${ADMIN_PAGE_SUBTITLE}`}>
          Բիզնեսի արդյունքներ և վիճակագրություն
        </p>
      </div>

      <AnalyticsOverviewCards
        snapshots={summary.overview}
        formatMoney={formatMoney}
      />

      <AnalyticsPeriodCard
        key={`${range.from}:${range.to}`}
        locale={locale}
        from={range.from}
        to={range.to}
        preset={preset}
        exportQuery={exportQuery}
        rangeInvalid={!parsed.success}
      />

      <AnalyticsSelectedRangeCards
        revenueLabel={formatMoney(summary.revenueAmount)}
        orderCount={summary.orderCount}
        averageOrderLabel={formatMoney(summary.averageOrderValue)}
        customerCount={summary.customerCount}
      />

      <AnalyticsTrendPanel
        rows={chartRows}
        bestDayLabel={
          summary.bestDay
            ? formatAnalyticsShortDate(summary.bestDay.date)
            : null
        }
        bestDayDetail={
          summary.bestDay
            ? `${formatMoney(summary.bestDay.revenueAmount)} · ${summary.bestDay.orderCount} պատվեր`
            : null
        }
        orderCountLabel={String(summary.orderCount)}
        revenueLabel={formatMoney(summary.revenueAmount)}
        averageOrderLabel={formatMoney(summary.averageOrderValue)}
      />

      <AnalyticsTopRankings
        products={summary.topProducts}
        categories={summary.topCategories}
        formatMoney={formatMoney}
      />
    </section>
  );
}
