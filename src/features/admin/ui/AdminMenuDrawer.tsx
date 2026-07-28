"use client";

import Link from "next/link";
import { useState } from "react";

import { SideSheet } from "@/components/ui/SideSheet";

import {
  getAdminMenuItems,
  isAdminTabActive,
  type AdminMenuItem,
} from "@/features/admin/ui/admin-menu.config";
import { AdminSheetHeader } from "@/features/admin/ui/AdminSheetHeader";
import {
  ADMIN_DRAWER_PANEL,
  ADMIN_MOBILE_MENU_TRIGGER,
  ADMIN_SHEET_NAV_ACTIVE,
  ADMIN_SHEET_NAV_IDLE,
} from "@/features/admin/ui/admin-shell-classes";
import { ADMIN_SHEET_SURFACE } from "@/features/admin/ui/admin-form-classes";
import { useAdminProductsSubnavExpanded } from "@/features/admin/ui/useAdminProductsSubnavExpanded";

type AdminMenuDrawerProps = {
  locale: string;
  pathname: string;
};

function isNestedVisible(
  tab: AdminMenuItem,
  pathname: string,
  locale: string,
  productsNestedExpanded: boolean,
): boolean {
  if (tab.parentGroupId !== "products") return true;
  if (isAdminTabActive(tab.href, pathname, locale)) return true;
  return productsNestedExpanded;
}

export function AdminMenuDrawer({ locale, pathname }: AdminMenuDrawerProps) {
  const [open, setOpen] = useState(false);
  const tabs = getAdminMenuItems(locale);
  const [productsNestedExpanded, toggleProductsNested] =
    useAdminProductsSubnavExpanded(pathname, locale);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="admin-menu-drawer-panel"
        onClick={() => setOpen((prev) => !prev)}
        className={ADMIN_MOBILE_MENU_TRIGGER}
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 6H20M4 12H16M4 18H12"
          />
        </svg>
        Menu
      </button>

      <SideSheet
        open={open}
        onClose={() => setOpen(false)}
        ariaLabel="Admin menu"
        side="left"
        panelClassName={ADMIN_DRAWER_PANEL}
        surfaceClassName={ADMIN_SHEET_SURFACE}
        closeTone="brand"
        backdropBlur
      >
        <div
          id="admin-menu-drawer-panel"
          className="flex min-h-0 flex-1 flex-col"
        >
          <AdminSheetHeader title="Admin menu">
            <Link
              href={`/${locale}`}
              className="mt-2 inline-block text-sm font-medium text-[#ff7f20] hover:underline"
              onClick={() => setOpen(false)}
            >
              View storefront
            </Link>
          </AdminSheetHeader>

          <nav className="flex-1 divide-y divide-[#ead7bf]/80 overflow-y-auto">
            {tabs.map((tab) => {
              if (
                !isNestedVisible(
                  tab,
                  pathname,
                  locale,
                  productsNestedExpanded,
                )
              ) {
                return null;
              }

              const isActive = isAdminTabActive(tab.href, pathname, locale);

              if (tab.id === "products") {
                return (
                  <div
                    key={tab.id}
                    className={`flex w-full ${isActive ? ADMIN_SHEET_NAV_ACTIVE : ""}`}
                  >
                    <Link
                      href={tab.href}
                      onClick={() => setOpen(false)}
                      className={`flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-sm font-medium ${
                        isActive ? "text-white" : ADMIN_SHEET_NAV_IDLE
                      } ${tab.isSubCategory ? "pl-10" : ""}`}
                    >
                      <span className="shrink-0">{tab.icon}</span>
                      <span className="truncate">{tab.label}</span>
                    </Link>
                    <button
                      type="button"
                      aria-expanded={productsNestedExpanded}
                      aria-label="Toggle product subpages"
                      onClick={toggleProductsNested}
                      className={`shrink-0 border-l px-3 py-3 ${
                        isActive
                          ? "border-white/25 text-white"
                          : "border-[#ead7bf] text-[#5c564e]"
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
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium ${
                    tab.isSubCategory ? "pl-10" : ""
                  } ${isActive ? ADMIN_SHEET_NAV_ACTIVE : ADMIN_SHEET_NAV_IDLE}`}
                >
                  <span className="shrink-0">{tab.icon}</span>
                  <span className="truncate">{tab.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </SideSheet>
    </div>
  );
}
