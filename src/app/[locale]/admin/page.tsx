import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { AdminMobileHub } from "@/features/admin/ui/AdminMobileHub";
import { DashboardStatsGrid } from "@/features/admin/ui/DashboardStatsGrid";
import {
  ADMIN_DASHBOARD_CARD,
  ADMIN_PAGE_SUBTITLE,
  ADMIN_QUICK_ACTION,
  ADMIN_VIEW_ALL_LINK,
} from "@/features/admin/ui/admin-form-classes";
import {
  ADMIN_BADGE,
  paymentStatusBadgeClass,
} from "@/features/admin/ui/status-badge";
import {
  defaultAnalyticsDateRange,
  formatPeriodDelta,
} from "@/features/analytics/domain/date-range";
import { getAdminDashboardMetrics } from "@/features/orders/application/queries";
import { SHOW_ADMIN_SETTINGS_UI } from "@/features/settings/admin-settings-ui";
import { requireAdmin } from "@/lib/auth/policies";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type AdminPageProps = {
  params: Promise<{ locale: string }>;
};

function formatMoney(amount: number): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const QUICK_ACTIONS = [
  {
    href: "products/new",
    title: "Add product",
    subtitle: "Create a new product",
    iconBg: "bg-[#3e573d]/15",
    iconColor: "text-[#3e573d]",
    iconPath: "M12 4v16m8-8H4",
  },
  {
    href: "orders",
    title: "Manage orders",
    subtitle: "View all orders",
    iconBg: "bg-[#ff7f20]/15",
    iconColor: "text-[#ff7f20]",
    iconPath:
      "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  },
  {
    href: "users",
    title: "Manage users",
    subtitle: "View all users",
    iconBg: "bg-[#9eff8e]/25",
    iconColor: "text-[#3e573d]",
    iconPath:
      "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  },
  {
    href: "settings",
    title: "Settings",
    subtitle: "Configure store",
    iconBg: "bg-[#f7d18f]/35",
    iconColor: "text-[#b7791f]",
    iconPath:
      "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
  },
] as const;

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const [user, metrics] = await Promise.all([
    requireAdmin(locale),
    getAdminDashboardMetrics(defaultAnalyticsDateRange()),
  ]);
  const dictionary = getDictionary(locale);
  const revenueDelta = `${formatPeriodDelta(
    metrics.revenueAmount,
    metrics.previousRevenueAmount,
  )} vs prev`;

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
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[#1f1a17]">
            Admin
          </h1>
          <p className={`mt-1 ${ADMIN_PAGE_SUBTITLE}`}>
            Welcome to the admin dashboard
          </p>
        </div>

        <DashboardStatsGrid
          locale={locale}
          users={metrics.users}
          products={metrics.products}
          orders={metrics.orders}
          revenueLabel={formatMoney(metrics.revenueAmount)}
          revenueDelta={revenueDelta}
        />

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className={ADMIN_DASHBOARD_CARD}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#1f1a17]">
                Recent orders
              </h2>
              <Link
                href={`/${locale}/admin/orders`}
                className={ADMIN_VIEW_ALL_LINK}
              >
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {metrics.recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/${locale}/admin/orders/${order.orderNumber}`}
                  className="block rounded-lg border border-[#e8e2d9] p-4 transition-colors hover:border-[#ff7f20]/30 hover:bg-[#fff8f2]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-[#1f1a17]">
                          #{order.orderNumber}
                        </p>
                        <span
                          className={`${ADMIN_BADGE} ${paymentStatusBadgeClass(order.status)}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="truncate text-xs text-[#5c564e]">
                        {order.contactEmail}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-[#1f1a17]">
                      {formatMoney(order.totalAmount)} {order.baseCurrency}
                    </p>
                  </div>
                </Link>
              ))}
              {metrics.recentOrders.length === 0 ? (
                <p className="py-8 text-center text-sm text-[#8a837a]">
                  No recent orders.
                </p>
              ) : null}
            </div>
          </Card>

          <Card className={ADMIN_DASHBOARD_CARD}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#1f1a17]">
                Top products
              </h2>
              <Link
                href={`/${locale}/admin/products`}
                className={ADMIN_VIEW_ALL_LINK}
              >
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {metrics.topProducts.map((product, index) => (
                <div
                  key={product.productId}
                  className="flex items-center gap-4 rounded-lg border border-[#e8e2d9] p-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-[#3e573d]/10 text-xs font-bold text-[#3e573d]">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#1f1a17]">
                      {product.title}
                    </p>
                    <p className="text-xs text-[#8a837a]">
                      {product.quantity} sold
                    </p>
                  </div>
                </div>
              ))}
              {metrics.topProducts.length === 0 ? (
                <p className="py-8 text-center text-sm text-[#8a837a]">
                  No product sales in this range.
                </p>
              ) : null}
            </div>
          </Card>
        </div>

        <Card className={`mb-8 ${ADMIN_DASHBOARD_CARD}`}>
          <h2 className="mb-4 text-xl font-semibold text-[#1f1a17]">
            Quick actions
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {QUICK_ACTIONS.filter(
              (action) =>
                action.href !== "settings" || SHOW_ADMIN_SETTINGS_UI,
            ).map((action) => (
              <Link
                key={action.href}
                href={`/${locale}/admin/${action.href}`}
                className={ADMIN_QUICK_ACTION}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${action.iconBg}`}
                >
                  <svg
                    className={`h-5 w-5 ${action.iconColor}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={action.iconPath}
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-medium text-[#1f1a17]">{action.title}</p>
                  <p className="text-xs text-[#8a837a]">{action.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </section>
    </>
  );
}
