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
import {
  analyticsPaymentMethodFilterLabel,
  parseAnalyticsPaymentMethodFilter,
  type AnalyticsPaymentMethodFilter,
} from "@/features/analytics/domain/payment-method-filter";
import { AnalyticsOverviewCards } from "@/features/analytics/ui/AnalyticsOverviewCards";
import { AnalyticsPaymentBreakdown } from "@/features/analytics/ui/AnalyticsPaymentBreakdown";
import { AnalyticsPeriodCard } from "@/features/analytics/ui/AnalyticsPeriodCard";
import { AnalyticsSelectedRangeCards } from "@/features/analytics/ui/AnalyticsSelectedRangeCards";
import { AnalyticsShippingBreakdown } from "@/features/analytics/ui/AnalyticsShippingBreakdown";
import { AnalyticsTodaySoldProducts } from "@/features/analytics/ui/AnalyticsTodaySoldProducts";
import { AnalyticsTopRankings } from "@/features/analytics/ui/AnalyticsTopRankings";
import { AnalyticsTrendPanel } from "@/features/analytics/ui/AnalyticsTrendPanel";
import {
  canChangeOrderStatus,
  canManageOrderAdmin,
} from "@/features/users/domain/user-lifecycle";
import { requireAdmin } from "@/lib/auth/policies";
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

  const user = await requireAdmin(locale);
  const raw = await searchParams;
  const defaults = rangeForAnalyticsPeriod("last_7_days");
  const parsed = analyticsDateRangeSchema.safeParse({
    from: firstParam(raw.from) ?? defaults.from,
    to: firstParam(raw.to) ?? defaults.to,
  });

  const range = parsed.success ? parsed.data : defaults;
  const preset = matchAnalyticsPeriodPreset(range);
  const paymentMethod = parseAnalyticsPaymentMethodFilter(
    firstParam(raw.paymentMethod),
  );
  const summary = await getAnalyticsSummary({
    ...range,
    locale,
    paymentMethod,
  });
  const exportParams = new URLSearchParams({
    from: range.from,
    to: range.to,
  });
  if (paymentMethod !== "all") {
    exportParams.set("paymentMethod", paymentMethod);
  }
  const exportQuery = exportParams.toString();

  function hrefForPaymentMethod(
    nextPaymentMethod: AnalyticsPaymentMethodFilter,
  ): string {
    const params = new URLSearchParams({
      from: range.from,
      to: range.to,
    });
    if (nextPaymentMethod !== "all") {
      params.set("paymentMethod", nextPaymentMethod);
    }
    return `/${locale}/admin/analytics?${params.toString()}`;
  }

  const formatMoney = (amount: number): string =>
    formatMoneyAmount(amount, "AMD", locale);
  const paymentFilterHint =
    paymentMethod === "all"
      ? "Ընտրված միջակայք"
      : `${analyticsPaymentMethodFilterLabel(paymentMethod)} · ընտրված միջակայք`;

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
        key={`${range.from}:${range.to}:${paymentMethod}`}
        locale={locale}
        from={range.from}
        to={range.to}
        preset={preset}
        paymentMethod={paymentMethod}
        exportQuery={exportQuery}
        rangeInvalid={!parsed.success}
      />

      <AnalyticsSelectedRangeCards
        revenueLabel={formatMoney(summary.revenueAmount)}
        orderCount={summary.orderCount}
        averageOrderLabel={formatMoney(summary.averageOrderValue)}
        customerCount={summary.customerCount}
        rangeHint={paymentFilterHint}
      />

      <AnalyticsPaymentBreakdown
        rows={summary.paymentBreakdown}
        activeFilter={paymentMethod}
        formatMoney={formatMoney}
        hrefForMethod={hrefForPaymentMethod}
      />

      <AnalyticsShippingBreakdown
        rows={summary.shippingBreakdown}
        paymentMethod={paymentMethod}
        formatMoney={formatMoney}
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

      <AnalyticsTodaySoldProducts
        locale={locale}
        items={summary.todaySoldItems}
        capabilities={{
          canChangeOrderStatus: canChangeOrderStatus(user.role),
          canChangePaymentStatus: canManageOrderAdmin(user.role),
          canArchiveOrders: canManageOrderAdmin(user.role),
        }}
      />
    </section>
  );
}
