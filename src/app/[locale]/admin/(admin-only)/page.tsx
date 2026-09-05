import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminMobileHub } from "@/features/admin/ui/AdminMobileHub";
import { DashboardChartRangeToggle } from "@/features/admin/ui/DashboardChartRangeToggle";
import { DashboardCommercePanels } from "@/features/admin/ui/DashboardCommercePanels";
import { DashboardStatsGrid } from "@/features/admin/ui/DashboardStatsGrid";
import { ADMIN_PAGE_SUBTITLE } from "@/features/admin/ui/admin-form-classes";
import { getAnalyticsSummary } from "@/features/analytics/application/queries";
import {
  buildDashboardMonthlySeries,
  parseDashboardChartRange,
  rangeForDashboardChartRange,
  rangeForDashboardMetricPeriod,
  summarizeTrendPoints,
} from "@/features/analytics/domain/dashboard-periods";
import { AnalyticsOverviewCards } from "@/features/analytics/ui/AnalyticsOverviewCards";
import { AnalyticsTrendPanel } from "@/features/analytics/ui/AnalyticsTrendPanel";
import { getAdminDashboardMetrics } from "@/features/orders/application/queries";
import { requireAdmin } from "@/lib/auth/policies";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { formatMoneyAmount } from "@/lib/money/format";

type AdminPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminPage({
  params,
  searchParams,
}: AdminPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const raw = await searchParams;
  const chart = parseDashboardChartRange(firstParam(raw.chart));
  const chartRange = rangeForDashboardChartRange(chart);
  const monthRange = rangeForDashboardMetricPeriod("month");

  const [user, metrics, chartSummary] = await Promise.all([
    requireAdmin(locale),
    getAdminDashboardMetrics(monthRange),
    getAnalyticsSummary({ ...chartRange, locale }),
  ]);

  const dictionary = getDictionary(locale);
  const copy = dictionary.adminDashboard;
  const formatMoney = (amount: number): string =>
    formatMoneyAmount(amount, "AMD", locale);

  const trendPoints = buildDashboardMonthlySeries(
    chartSummary.dailyRows,
    chartRange,
    locale,
  );
  const trend = summarizeTrendPoints(trendPoints);
  const chartRows = trendPoints.map((point) => ({
    date: `${point.key}-01`,
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
    <>
      <div className="lg:hidden">
        <AdminMobileHub
          locale={locale}
          user={user}
          dictionary={dictionary.adminMobile}
          logoutLabel={dictionary.header.logout}
        />
      </div>

      <section className="hidden lg:block">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#1f1a17]">
              {copy.title}
            </h1>
            <p className={`mt-1 ${ADMIN_PAGE_SUBTITLE}`}>{copy.subtitle}</p>
          </div>
          <Link
            href={`/${locale}/admin/analytics`}
            className="text-sm font-semibold text-[#ff7f20] hover:text-[#f55c0a] hover:underline"
          >
            {copy.viewAnalytics}
          </Link>
        </div>

        <DashboardStatsGrid
          locale={locale}
          users={metrics.users}
          products={metrics.products}
          usersLabel={copy.users}
          productsLabel={copy.activeProducts}
        />

        <AnalyticsOverviewCards
          snapshots={chartSummary.overview}
          formatMoney={formatMoney}
          copy={{
            periods: {
              today: copy.periodToday,
              week: copy.periodWeek,
              month: copy.periodMonth,
              quarter: copy.periodQuarter,
            },
            orders: copy.chartOrders,
            averageOrder: copy.chartAov,
          }}
        />

        <AnalyticsTrendPanel
          rows={chartRows}
          bestDayLabel={trend.best?.label ?? null}
          bestDayDetail={
            trend.best ? formatMoney(trend.best.revenueAmount) : null
          }
          orderCountLabel={String(trend.orderCount)}
          revenueLabel={formatMoney(trend.revenueAmount)}
          averageOrderLabel={formatMoney(trend.averageOrderValue)}
          copy={{
            title: copy.chartTitle,
            subtitle: copy.chartSubtitle,
            revenue: copy.chartRevenue,
            orders: copy.chartOrders,
            averageOrder: copy.chartAov,
            empty: copy.chartEmpty,
            bestTitle: copy.bestMonth,
            bestEmpty: copy.bestMonthEmpty,
          }}
          headerAction={
            <Suspense fallback={null}>
              <DashboardChartRangeToggle
                chart={chart}
                months6Label={copy.chartRange6Months}
                yearLabel={copy.chartRangeYear}
              />
            </Suspense>
          }
        />

        <DashboardCommercePanels
          locale={locale}
          copy={copy}
          recentOrders={metrics.recentOrders}
          topProducts={metrics.topProducts}
          formatMoney={formatMoney}
        />
      </section>
    </>
  );
}
