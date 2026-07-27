import { notFound } from "next/navigation";
import { ArrowRight, ShoppingBag } from "lucide-react";

import { AppLink } from "@/components/ui/AppLink";
import { getProfileDashboard } from "@/features/profile/application/dashboard-queries";
import { ProfileStatCard } from "@/features/profile/ui/ProfileStatCard";
import { requireUser } from "@/lib/auth/policies";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { formatMoneyAmount } from "@/lib/money/format";

type ProfilePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const user = await requireUser(locale);
  const dictionary = getDictionary(locale);
  const { stats, recentOrders } = await getProfileDashboard(user.id);

  return (
    <section className="profile-sheet-keep-frame space-y-8 lg:space-y-10">
      <div className="relative overflow-hidden rounded-[24px] border border-brand/15 bg-white px-5 py-6 sm:px-7 sm:py-7">
        <p className="relative text-[11px] font-bold tracking-[0.18em] text-brand uppercase">
          Degusto
        </p>
        <h1 className="relative mt-2 font-display text-3xl font-black tracking-tight text-product-ink sm:text-4xl">
          {dictionary.profile.dashboard}
        </h1>
        <p className="relative mt-2 max-w-xl text-sm leading-relaxed text-product-ink/65 sm:text-base">
          {dictionary.profile.welcome},{" "}
          <span className="font-semibold text-product-ink">{user.firstName}</span>
          .
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <ProfileStatCard
          label={dictionary.profile.totalOrders}
          value={String(stats.totalOrders)}
          tone="orders"
        />
        <ProfileStatCard
          label={dictionary.profile.pendingOrders}
          value={String(stats.pendingOrders)}
          tone="pending"
        />
        <ProfileStatCard
          label={dictionary.profile.completedOrders}
          value={String(stats.completedOrders)}
          tone="completed"
        />
        <ProfileStatCard
          label={dictionary.profile.totalSpent}
          value={formatMoneyAmount(stats.totalSpent, "AMD", locale)}
          tone="spent"
        />
      </div>

      <div className="overflow-hidden rounded-[24px] border border-brand/15 bg-white shadow-[0_18px_50px_-34px_rgba(28,25,23,0.4)]">
        <div className="flex items-center justify-between gap-3 border-b border-brand/10 bg-white px-5 py-4 sm:px-7">
          <h2 className="text-lg font-bold text-product-ink">
            {dictionary.profile.recentOrders}
          </h2>
          <AppLink
            href={`/${locale}/profile/orders`}
            prefetchPolicy="intent"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-brand transition hover:gap-2"
          >
            {dictionary.profile.viewAllOrders}
            <ArrowRight className="size-4" aria-hidden />
          </AppLink>
        </div>

        {recentOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-5 py-14 text-center sm:px-7">
            <span className="flex size-14 items-center justify-center rounded-full bg-[#fff7f0] text-brand">
              <ShoppingBag className="size-6" aria-hidden />
            </span>
            <p className="text-sm font-medium text-product-ink/65">
              {dictionary.profile.noOrders}
            </p>
            <AppLink
              href={`/${locale}/products`}
              prefetchPolicy="intent"
              className="mt-1 inline-flex h-10 items-center justify-center rounded-full bg-brand px-5 text-sm font-bold text-white transition hover:brightness-95"
            >
              {dictionary.nav.shop}
            </AppLink>
          </div>
        ) : (
          <ul className="divide-y divide-brand/10">
            {recentOrders.map((order) => (
              <li
                key={order.id}
                className="flex flex-col gap-1 px-5 py-4 transition-colors hover:bg-[#fffaf6] sm:flex-row sm:items-center sm:justify-between sm:px-7"
              >
                <div>
                  <p className="font-semibold text-product-ink">
                    {dictionary.profile.orderNumber} {order.orderNumber}
                  </p>
                  <p className="mt-0.5 text-sm text-product-ink/55">
                    {dictionary.profile.status}: {order.status}
                  </p>
                </div>
                <p className="text-sm font-black text-product-ink sm:text-base">
                  {formatMoneyAmount(order.totalAmount, "AMD", locale)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
