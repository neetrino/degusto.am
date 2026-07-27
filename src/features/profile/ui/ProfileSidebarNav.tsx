"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Lock,
  LogOut,
  MapPin,
  Package,
  Trash2,
  User,
} from "lucide-react";

import { AppLink } from "@/components/ui/AppLink";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

type ProfileSidebarNavProps = {
  locale: Locale;
  dictionary: Dictionary["profile"];
  logoutAction: (formData: FormData) => void | Promise<void>;
};

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  exact?: boolean;
};

function navClassName(active: boolean): string {
  const base =
    "group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition-all duration-200";
  return active
    ? `${base} bg-[#fff0e4] text-product-ink shadow-[inset_0_0_0_1px_rgba(246,104,18,0.18)]`
    : `${base} text-product-ink/60 hover:bg-[#fff7f0] hover:text-product-ink`;
}

export function ProfileSidebarNav({
  locale,
  dictionary,
  logoutAction,
}: ProfileSidebarNavProps) {
  const pathname = usePathname();

  const items: NavItem[] = [
    {
      href: `/${locale}/profile`,
      label: dictionary.dashboard,
      icon: <LayoutDashboard className="h-4 w-4" />,
      exact: true,
    },
    {
      href: `/${locale}/profile/orders`,
      label: dictionary.orders,
      icon: <Package className="h-4 w-4" />,
    },
    {
      href: `/${locale}/profile/personal-information`,
      label: dictionary.personal,
      icon: <User className="h-4 w-4" />,
    },
    {
      href: `/${locale}/profile/addresses`,
      label: dictionary.addresses,
      icon: <MapPin className="h-4 w-4" />,
    },
    {
      href: `/${locale}/profile/password`,
      label: dictionary.password,
      icon: <Lock className="h-4 w-4" />,
    },
    {
      href: `/${locale}/profile/delete-account`,
      label: dictionary.deleteAccount,
      icon: <Trash2 className="h-4 w-4" />,
    },
  ];

  return (
    <div className="flex h-full flex-col p-3 sm:p-4">
      <nav className="flex flex-col gap-1.5" aria-label={dictionary.title}>
        {items.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <AppLink
              key={item.href}
              href={item.href}
              prefetchPolicy="intent"
              className={navClassName(active)}
              aria-current={active ? "page" : undefined}
            >
              <span
                className={
                  active
                    ? "flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-[0_8px_16px_-8px_rgba(246,104,18,0.9)]"
                    : "flex h-9 w-9 items-center justify-center rounded-xl bg-[#f3f3f3] text-product-ink/45 transition-colors group-hover:bg-brand/15 group-hover:text-brand"
                }
              >
                {item.icon}
              </span>
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {active ? (
                <span
                  aria-hidden
                  className="size-1.5 shrink-0 rounded-full bg-brand"
                />
              ) : null}
            </AppLink>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-brand/10 pt-3">
        <form action={logoutAction}>
          <button
            type="submit"
            className="group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-500 transition-colors group-hover:bg-red-100">
              <LogOut className="h-4 w-4" />
            </span>
            {dictionary.logout}
          </button>
        </form>
      </div>
    </div>
  );
}
