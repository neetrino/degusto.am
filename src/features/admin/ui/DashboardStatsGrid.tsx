import Link from "next/link";

import { Card } from "@/components/ui/Card";

type DashboardStatsGridProps = {
  locale: string;
  users: number;
  products: number;
  orders: number;
  revenueLabel: string;
  revenueDelta?: string;
};

function StatCard({
  href,
  label,
  value,
  hint,
  iconBg,
  iconColor,
  iconPath,
}: {
  href: string;
  label: string;
  value: string;
  hint?: string;
  iconBg: string;
  iconColor: string;
  iconPath: string;
}) {
  return (
    <Link href={href} className="block h-full">
      <Card className="flex h-full border-[#e8e2d9] p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ff7f20]/35 hover:shadow-[0_12px_28px_rgba(255,127,32,0.12)]">
        <div className="flex w-full items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#5c564e]">{label}</p>
            <p className="mt-1 text-2xl font-bold text-[#1f1a17]">{value}</p>
            <p className="mt-1 min-h-4 text-xs text-[#8a837a]">{hint ?? "\u00a0"}</p>
          </div>
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${iconBg}`}
          >
            <svg
              className={`h-6 w-6 ${iconColor}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={iconPath}
              />
            </svg>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export function DashboardStatsGrid({
  locale,
  users,
  products,
  orders,
  revenueLabel,
  revenueDelta,
}: DashboardStatsGridProps) {
  const base = `/${locale}/admin`;

  return (
    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        href={`${base}/users`}
        label="Users"
        value={String(users)}
        iconBg="bg-[#ff7f20]/15"
        iconColor="text-[#ff7f20]"
        iconPath="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
      <StatCard
        href={`${base}/products`}
        label="Active products"
        value={String(products)}
        iconBg="bg-[#3e573d]/15"
        iconColor="text-[#3e573d]"
        iconPath="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
      <StatCard
        href={`${base}/orders`}
        label="Orders (range)"
        value={String(orders)}
        iconBg="bg-[#f7d18f]/35"
        iconColor="text-[#b7791f]"
        iconPath="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
      <StatCard
        href={`${base}/analytics`}
        label="Revenue (range)"
        value={revenueLabel}
        hint={revenueDelta}
        iconBg="bg-[#9eff8e]/25"
        iconColor="text-[#3e573d]"
        iconPath="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </div>
  );
}
