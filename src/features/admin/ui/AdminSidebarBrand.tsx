"use client";

import Link from "next/link";

import { useAdminSidebarCollapse } from "@/features/admin/ui/AdminSidebarCollapseContext";

type AdminSidebarBrandProps = {
  locale: string;
};

export function AdminSidebarBrand({ locale }: AdminSidebarBrandProps) {
  const { collapsed, toggleCollapsed } = useAdminSidebarCollapse();

  return (
    <div
      className={`relative z-10 flex shrink-0 border-b border-white/15 pb-3 pt-2 ${
        collapsed
          ? "flex-col items-center gap-2 px-1"
          : "items-center gap-1 px-2"
      }`}
    >
      {collapsed ? (
        <Link
          href={`/${locale}`}
          className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-lg font-extrabold leading-none text-[#f66812] transition-colors hover:bg-[#fff2e8]"
          title="Degusto home"
        >
          D
        </Link>
      ) : (
        <Link
          href={`/${locale}`}
          className="group flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-2 transition-colors hover:bg-white/10"
          title="Degusto home"
        >
          <span className="font-display truncate text-xl font-black tracking-tight text-white">
            Degusto
          </span>
        </Link>
      )}
      <button
        type="button"
        onClick={toggleCollapsed}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/25 text-white/80 transition-colors hover:border-white/45 hover:bg-white/10 hover:text-white"
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        ) : (
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
