"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  getAdminMenuItems,
  isAdminTabActive,
  type AdminMenuItem,
} from "@/features/admin/ui/admin-menu.config";
import { AdminSidebarBrand } from "@/features/admin/ui/AdminSidebarBrand";
import { useAdminSidebarCollapse } from "@/features/admin/ui/AdminSidebarCollapseContext";
import {
  ADMIN_MOBILE_MENU_TRIGGER,
  ADMIN_NAV_ACTIVE,
  ADMIN_NAV_ICON_ACTIVE,
  ADMIN_NAV_ICON_IDLE,
  ADMIN_NAV_IDLE,
  ADMIN_SIDEBAR_ASIDE,
  ADMIN_SIDEBAR_MOBILE_DRAWER_WRAP,
  ADMIN_SIDEBAR_NAV,
} from "@/features/admin/ui/admin-shell-classes";
import { useAdminProductsSubnavExpanded } from "@/features/admin/ui/useAdminProductsSubnavExpanded";
import type { StaffRole } from "@/features/users/domain/user-lifecycle";

type AdminSidebarProps = {
  locale: string;
  role: StaffRole;
};

function isNestedVisible(
  tab: AdminMenuItem,
  pathname: string,
  locale: string,
  collapsed: boolean,
  productsNestedExpanded: boolean,
): boolean {
  if (tab.parentGroupId !== "products") return true;
  if (collapsed) return true;
  if (isAdminTabActive(tab.href, pathname, locale)) return true;
  return productsNestedExpanded;
}

export function AdminSidebar({ locale, role }: AdminSidebarProps) {
  const pathname = usePathname() ?? `/${locale}/admin`;
  const tabs = getAdminMenuItems(locale, role);
  const { collapsed } = useAdminSidebarCollapse();
  const [productsNestedExpanded, toggleProductsNested] =
    useAdminProductsSubnavExpanded(pathname, locale);

  const asideWidthClass = collapsed ? "lg:w-16" : "lg:w-64";
  const adminHome =
    role === "DISPATCHER"
      ? `/${locale}/admin/orders`
      : `/${locale}/admin`;
  const isAdminRoot =
    pathname === adminHome || pathname === `${adminHome}/`;

  return (
    <>
      {!isAdminRoot ? (
        <div className={ADMIN_SIDEBAR_MOBILE_DRAWER_WRAP}>
          <div className="flex items-center justify-between gap-3 rounded-[1.35rem] border border-[#ead7bf]/90 bg-white/95 px-3 py-2.5 shadow-[0_12px_28px_-22px_rgba(28,25,23,0.5)]">
            <Link
              href={adminHome}
              className="flex min-w-0 items-center gap-2.5"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff8a3d] to-[#f55c0a] text-sm font-black text-white shadow-[0_10px_18px_-10px_rgba(246,104,18,0.9)]">
                D
              </span>
              <span className="min-w-0">
                <span className="block truncate text-base font-semibold uppercase tracking-[0.04em] text-[#1f3a22]">
                  Degusto
                </span>
                <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a837a]">
                  {role === "DISPATCHER" ? "Dispatcher" : "Admin"}
                </span>
              </span>
            </Link>
            <Link
              href={adminHome}
              className={`${ADMIN_MOBILE_MENU_TRIGGER} lg:hidden`}
              aria-label="Admin home"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6H20M4 12H16M4 18H12"
                />
              </svg>
              Menu
            </Link>
          </div>
        </div>
      ) : null}
      <aside className={`${ADMIN_SIDEBAR_ASIDE} ${asideWidthClass}`}>
        <AdminSidebarBrand locale={locale} />
        <nav
          className={`relative z-10 ${ADMIN_SIDEBAR_NAV} ${collapsed ? "px-1" : "px-2"}`}
        >
          {tabs.map((tab) => {
            if (
              !isNestedVisible(
                tab,
                pathname,
                locale,
                collapsed,
                productsNestedExpanded,
              )
            ) {
              return null;
            }

            const isActive = isAdminTabActive(tab.href, pathname, locale);
            const rowClasses = `flex w-full items-center rounded-md text-sm font-medium transition-all ${
              collapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-3"
            } ${tab.isSubCategory && !collapsed ? "pl-12" : ""} ${
              isActive ? ADMIN_NAV_ACTIVE : ADMIN_NAV_IDLE
            }`;

            if (tab.id === "products" && !collapsed) {
              return (
                <div
                  key={tab.id}
                  className={`flex w-full min-w-0 overflow-hidden rounded-md ${
                    isActive ? ADMIN_NAV_ACTIVE : "bg-transparent"
                  }`}
                >
                  <Link
                    href={tab.href}
                    title={tab.label}
                    className={`flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-all ${
                      isActive
                        ? "text-white hover:bg-black/10"
                        : `${ADMIN_NAV_IDLE}`
                    }`}
                  >
                    <span
                      className={`shrink-0 ${isActive ? ADMIN_NAV_ICON_ACTIVE : ADMIN_NAV_ICON_IDLE}`}
                    >
                      {tab.icon}
                    </span>
                    <span className="min-w-0 truncate">{tab.label}</span>
                  </Link>
                  <button
                    type="button"
                    aria-expanded={productsNestedExpanded}
                    aria-label="Toggle product subpages"
                    title="Toggle product subpages"
                    onClick={(event) => {
                      event.preventDefault();
                      toggleProductsNested();
                    }}
                    className={`shrink-0 border-l px-2 py-3 transition-colors ${
                      isActive
                        ? "border-white/25 text-white hover:bg-black/10"
                        : "border-white/15 text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <svg
                      className={`h-5 w-5 transition-transform ${productsNestedExpanded ? "" : "-rotate-90"}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </div>
              );
            }

            return (
              <Link
                key={tab.id}
                href={tab.href}
                title={tab.label}
                className={rowClasses}
              >
                <span
                  className={`shrink-0 ${isActive ? ADMIN_NAV_ICON_ACTIVE : ADMIN_NAV_ICON_IDLE}`}
                >
                  {tab.icon}
                </span>
                {collapsed ? null : (
                  <span className="min-w-0 truncate">{tab.label}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
