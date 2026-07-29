"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  Home,
  LayoutDashboard,
  Lock,
  LogOut,
  MapPin,
  Package,
  Trash2,
  User,
} from "lucide-react";

import { AppLink } from "@/components/ui/AppLink";
import { logoutAction } from "@/features/auth/logout-action";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { SessionUser } from "@/lib/auth/session";

type ProfileMobileHubProps = {
  locale: Locale;
  user: SessionUser;
  dictionary: Dictionary["profile"];
  homeLabel: string;
  onOpenDashboard: () => void;
};

type MenuItem = {
  href: string;
  label: string;
  icon: ReactNode;
  exact?: boolean;
  danger?: boolean;
  iconTheme: "neutral" | "amber" | "sky";
};

const ICON_THEMES = {
  neutral: { bg: "bg-[#f3f3f3]", fg: "text-product-ink" },
  amber: { bg: "bg-brand/15", fg: "text-brand" },
  sky: { bg: "bg-[#fff7f0]", fg: "text-brand-strong" },
} as const;

/** Mobile profile hub — Degusto branded cards. */
export function ProfileMobileHub({
  locale,
  user,
  dictionary,
  homeLabel,
  onOpenDashboard,
}: ProfileMobileHubProps) {
  const pathname = usePathname() ?? "";
  const logoutWithLocale = logoutAction.bind(null, locale);
  const displayName = `${user.firstName} ${user.lastName}`.trim();
  const initials = `${user.firstName.slice(0, 1)}${user.lastName.slice(0, 1)}`.toUpperCase();
  const hubHref = `/${locale}/profile`;
  const homeHref = `/${locale}`;

  const items: MenuItem[] = [
    {
      href: homeHref,
      label: homeLabel,
      icon: <Home className="h-5 w-5" />,
      exact: true,
      iconTheme: "amber",
    },
    {
      href: hubHref,
      label: dictionary.dashboard,
      icon: <LayoutDashboard className="h-5 w-5" />,
      exact: true,
      iconTheme: "neutral",
    },
    {
      href: `/${locale}/profile/orders`,
      label: dictionary.orders,
      icon: <Package className="h-5 w-5" />,
      iconTheme: "amber",
    },
    {
      href: `/${locale}/profile/personal-information`,
      label: dictionary.personal,
      icon: <User className="h-5 w-5" />,
      iconTheme: "sky",
    },
    {
      href: `/${locale}/profile/addresses`,
      label: dictionary.addresses,
      icon: <MapPin className="h-5 w-5" />,
      iconTheme: "neutral",
    },
    {
      href: `/${locale}/profile/password`,
      label: dictionary.password,
      icon: <Lock className="h-5 w-5" />,
      iconTheme: "amber",
    },
    {
      href: `/${locale}/profile/delete-account`,
      label: dictionary.deleteAccount,
      icon: <Trash2 className="h-5 w-5" />,
      danger: true,
      iconTheme: "sky",
    },
  ];

  const mainItems = items.filter((item) => !item.danger);
  const dangerItem = items.find((item) => item.danger);

  function isActive(item: MenuItem): boolean {
    if (item.exact) {
      return pathname === item.href || pathname === `${item.href}/`;
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  function renderRow(item: MenuItem): ReactNode {
    const theme = ICON_THEMES[item.iconTheme];
    const active = isActive(item);
    const content = (
      <>
        <span className="flex min-w-0 items-center gap-3">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
              item.danger
                ? "bg-red-50 text-red-500"
                : active
                  ? "bg-brand text-white shadow-[0_10px_20px_-12px_rgba(246,104,18,0.95)]"
                  : `${theme.bg} ${theme.fg}`
            }`}
          >
            {item.icon}
          </span>
          <span
            className={`truncate text-base font-semibold ${
              item.danger ? "text-red-500" : "text-product-ink"
            }`}
          >
            {item.label}
          </span>
        </span>
        <ChevronRight
          className={`h-[18px] w-[18px] shrink-0 ${
            item.danger ? "text-red-400" : "text-product-ink/30"
          }`}
          aria-hidden
        />
      </>
    );

    if (item.exact) {
      if (item.href === homeHref) {
        return (
          <AppLink
            key={item.href}
            href={item.href}
            prefetchPolicy="intent"
            aria-current={active ? "page" : undefined}
            className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-[#fff7f0]/80"
          >
            {content}
          </AppLink>
        );
      }

      return (
        <button
          key={item.href}
          type="button"
          onClick={onOpenDashboard}
          aria-current={active ? "page" : undefined}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-[#fff7f0]/80"
        >
          {content}
        </button>
      );
    }

    if (item.danger) {
      return (
        <div key={item.href} className="px-3 py-2">
          <AppLink
            href={item.href}
            prefetchPolicy="intent"
            className="flex w-full items-center justify-between rounded-2xl border border-red-200 bg-white px-3 py-3 text-left transition-colors hover:bg-red-50/60"
          >
            {content}
          </AppLink>
        </div>
      );
    }

    return (
      <AppLink
        key={item.href}
        href={item.href}
        prefetchPolicy="intent"
        aria-current={active ? "page" : undefined}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-[#fff7f0]/80"
      >
        {content}
      </AppLink>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <section
        className="relative overflow-hidden rounded-[2rem] border border-brand/20 bg-white px-5 py-6 shadow-[0_18px_40px_-28px_rgba(246,104,18,0.55)]"
        aria-label={dictionary.title}
      >
        <div className="relative flex items-center gap-3.5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand text-lg font-black text-white ring-4 ring-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-xl font-black leading-tight text-product-ink">
              {displayName}
            </p>
            <p className="mt-0.5 truncate text-sm leading-snug text-product-ink/55">
              {user.email}
            </p>
          </div>
        </div>
      </section>

      <nav
        className="overflow-hidden rounded-[2rem] border border-brand/15 bg-white py-1 shadow-[0_14px_36px_-28px_rgba(28,25,23,0.45)]"
        aria-label={dictionary.title}
      >
        <div className="divide-y divide-[#f3f3f3]">
          {mainItems.map((item) => renderRow(item))}
        </div>
        {dangerItem ? renderRow(dangerItem) : null}
      </nav>

      <form action={logoutWithLocale}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2.5 rounded-[2rem] bg-brand py-3.5 text-base font-bold text-white shadow-[0_14px_28px_-14px_rgba(246,104,18,0.9)] transition hover:brightness-95"
        >
          <LogOut className="h-5 w-5 shrink-0" aria-hidden />
          {dictionary.logout}
        </button>
      </form>
    </div>
  );
}
