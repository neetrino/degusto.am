"use client";

import type { ReactNode } from "react";
import {
  BarChart3,
  ChevronRight,
  ClipboardList,
  ImageIcon,
  LogOut,
  MessageSquare,
  Newspaper,
  Package,
  Percent,
  Settings,
  Tags,
  Ticket,
  Truck,
  Users,
} from "lucide-react";

import { AppLink } from "@/components/ui/AppLink";
import { logoutAction } from "@/features/auth/logout-action";
import { SHOW_ADMIN_BLOG_UI } from "@/features/blog/admin-blog-ui";
import { SHOW_ADMIN_MESSAGES_UI } from "@/features/contact/admin-messages-ui";
import { SHOW_ADMIN_HERO_UI } from "@/features/hero/admin-hero-ui";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { SessionUser } from "@/lib/auth/session";

type AdminMobileHubProps = {
  locale: Locale;
  user: SessionUser;
  dictionary: Dictionary["adminMobile"];
  logoutLabel: string;
};

type SectionTone = "brand" | "forest" | "amber" | "sky" | "rose" | "slate";

type SectionItem = {
  href: string;
  label: string;
  icon: ReactNode;
  tone: SectionTone;
};

const TONE_STYLES: Record<
  SectionTone,
  { tile: string; icon: string; ring: string }
> = {
  brand: {
    tile: "bg-gradient-to-br from-[#ff8a3d] to-[#f55c0a]",
    icon: "text-white",
    ring: "ring-[#ff7f20]/20",
  },
  forest: {
    tile: "bg-gradient-to-br from-[#3e573d] to-[#1f3a22]",
    icon: "text-white",
    ring: "ring-[#1f3a22]/15",
  },
  amber: {
    tile: "bg-gradient-to-br from-[#ffb347] to-[#ff7f20]",
    icon: "text-white",
    ring: "ring-[#ffb347]/25",
  },
  sky: {
    tile: "bg-gradient-to-br from-[#5b8def] to-[#3b6fd9]",
    icon: "text-white",
    ring: "ring-[#5b8def]/20",
  },
  rose: {
    tile: "bg-gradient-to-br from-[#f07373] to-[#e04545]",
    icon: "text-white",
    ring: "ring-[#e04545]/15",
  },
  slate: {
    tile: "bg-gradient-to-br from-[#5c564e] to-[#3a3530]",
    icon: "text-white",
    ring: "ring-[#5c564e]/15",
  },
};

/** Mobile-first admin hub — adaptive section grid with Degusto brand language. */
export function AdminMobileHub({
  locale,
  user,
  dictionary,
  logoutLabel,
}: AdminMobileHubProps) {
  const logoutWithLocale = logoutAction.bind(null, locale);
  const displayName = `${user.firstName} ${user.lastName}`.trim();
  const initials =
    `${user.firstName.slice(0, 1)}${user.lastName.slice(0, 1)}`.toUpperCase() ||
    "A";
  const base = `/${locale}/admin`;

  const sections: SectionItem[] = [
    {
      href: `${base}/orders`,
      label: dictionary.orders,
      icon: <ClipboardList className="h-5 w-5" strokeWidth={2.25} />,
      tone: "brand",
    },
    {
      href: `${base}/products`,
      label: dictionary.products,
      icon: <Package className="h-5 w-5" strokeWidth={2.25} />,
      tone: "forest",
    },
    {
      href: `${base}/analytics`,
      label: dictionary.analytics,
      icon: <BarChart3 className="h-5 w-5" strokeWidth={2.25} />,
      tone: "amber",
    },
    {
      href: `${base}/categories`,
      label: dictionary.categories,
      icon: <Tags className="h-5 w-5" strokeWidth={2.25} />,
      tone: "sky",
    },
    ...(SHOW_ADMIN_MESSAGES_UI
      ? [
          {
            href: `${base}/messages`,
            label: dictionary.messages,
            icon: <MessageSquare className="h-5 w-5" strokeWidth={2.25} />,
            tone: "rose" as const,
          },
        ]
      : []),
    {
      href: `${base}/users`,
      label: dictionary.users,
      icon: <Users className="h-5 w-5" strokeWidth={2.25} />,
      tone: "slate",
    },
    {
      href: `${base}/discounts`,
      label: dictionary.discounts,
      icon: <Percent className="h-5 w-5" strokeWidth={2.25} />,
      tone: "brand",
    },
    {
      href: `${base}/coupons`,
      label: dictionary.coupons,
      icon: <Ticket className="h-5 w-5" strokeWidth={2.25} />,
      tone: "amber",
    },
    {
      href: `${base}/delivery`,
      label: dictionary.delivery,
      icon: <Truck className="h-5 w-5" strokeWidth={2.25} />,
      tone: "forest",
    },
    ...(SHOW_ADMIN_BLOG_UI
      ? [
          {
            href: `${base}/blog`,
            label: dictionary.blog,
            icon: <Newspaper className="h-5 w-5" strokeWidth={2.25} />,
            tone: "sky" as const,
          },
        ]
      : []),
    ...(SHOW_ADMIN_HERO_UI
      ? [
          {
            href: `${base}/hero`,
            label: dictionary.hero,
            icon: <ImageIcon className="h-5 w-5" strokeWidth={2.25} />,
            tone: "rose" as const,
          },
        ]
      : []),
    {
      href: `${base}/settings`,
      label: dictionary.settings,
      icon: <Settings className="h-5 w-5" strokeWidth={2.25} />,
      tone: "slate",
    },
  ];

  return (
    <div className="relative mx-auto w-full max-w-lg pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <section
        className="relative isolate overflow-hidden rounded-[1.75rem] border border-brand/20 bg-white p-5 shadow-[0_20px_48px_-28px_rgba(246,104,18,0.55)] sm:rounded-[2rem] sm:p-6"
        aria-label={dictionary.title}
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(ellipse_at_top_right,_rgba(255,127,32,0.12),_transparent_55%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-brand/10 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-[#1f3a22]/10 blur-2xl"
          aria-hidden
        />

        <div className="relative flex items-center gap-3.5 sm:gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff8a3d] to-[#f55c0a] text-lg font-black text-white shadow-[0_12px_24px_-10px_rgba(246,104,18,0.9)] ring-4 ring-white sm:h-16 sm:w-16 sm:rounded-[1.25rem] sm:text-xl">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 inline-flex items-center rounded-full bg-[#1f3a22] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white sm:text-[11px]">
              {dictionary.badge}
            </div>
            <p className="truncate font-display text-xl font-black leading-tight text-product-ink sm:text-2xl">
              {displayName}
            </p>
            <p className="mt-0.5 truncate text-sm leading-snug text-product-ink/55">
              {user.email}
            </p>
          </div>
        </div>
      </section>

      <p className="relative mt-5 px-0.5 text-sm font-semibold text-product-ink/55 sm:mt-6 sm:text-base">
        {dictionary.selectSection}
      </p>

      <nav
        aria-label={dictionary.title}
        className="relative mt-3 grid grid-cols-2 gap-2.5 sm:mt-4 sm:gap-3.5"
      >
        {sections.map((section) => {
          const tone = TONE_STYLES[section.tone];
          return (
            <AppLink
              key={section.href}
              href={section.href}
              prefetchPolicy="intent"
              className={`group flex min-h-[5.75rem] min-w-0 flex-col justify-between overflow-hidden rounded-[1.35rem] border border-[#ead7bf]/90 bg-white p-3.5 shadow-[0_10px_28px_-22px_rgba(28,25,23,0.55)] transition duration-200 hover:-translate-y-0.5 hover:border-brand/35 hover:shadow-[0_16px_32px_-20px_rgba(246,104,18,0.45)] active:scale-[0.98] sm:min-h-[6.5rem] sm:rounded-[1.5rem] sm:p-4 ${tone.ring} ring-1`}
            >
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl shadow-[0_10px_18px_-10px_rgba(0,0,0,0.35)] transition group-hover:scale-105 sm:h-11 sm:w-11 sm:rounded-[0.9rem] ${tone.tile} ${tone.icon}`}
              >
                {section.icon}
              </span>
              <span className="mt-3 flex min-w-0 items-end justify-between gap-1">
                <span className="min-w-0 flex-1 text-[12px] font-bold leading-snug break-all text-product-ink sm:text-sm">
                  {section.label}
                </span>
                <ChevronRight
                  className="mb-0.5 h-4 w-4 shrink-0 text-product-ink/25 transition group-hover:translate-x-0.5 group-hover:text-brand"
                  aria-hidden
                />
              </span>
            </AppLink>
          );
        })}
      </nav>

      <form action={logoutWithLocale} className="relative mt-5 sm:mt-6">
        <button
          type="submit"
          className="flex min-h-12 w-full items-center justify-center gap-2.5 rounded-[1.35rem] bg-gradient-to-r from-[#ff8a3d] to-[#f55c0a] py-3.5 text-base font-bold text-white shadow-[0_16px_32px_-14px_rgba(246,104,18,0.95)] transition hover:brightness-95 active:scale-[0.99] sm:rounded-[1.5rem]"
        >
          <LogOut className="h-5 w-5 shrink-0" aria-hidden />
          {logoutLabel}
        </button>
      </form>
    </div>
  );
}
