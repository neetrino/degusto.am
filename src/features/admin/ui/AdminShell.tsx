"use client";

import type { ReactNode } from "react";

import { AdminSidebar } from "@/features/admin/ui/AdminSidebar";
import { AdminSidebarCollapseProvider } from "@/features/admin/ui/AdminSidebarCollapseContext";
import {
  ADMIN_MAIN_INNER,
  ADMIN_PAGE_SHELL,
} from "@/features/admin/ui/admin-shell-classes";
import { NewOrderAlertProvider } from "@/features/orders/ui/NewOrderAlertContext";
import type { NewOrderAlertCopy } from "@/features/orders/ui/new-order-alert-types";
import type { StaffRole } from "@/features/users/domain/user-lifecycle";

type AdminShellProps = {
  locale: string;
  role: StaffRole;
  children: ReactNode;
  /** Localized copy for the new-order staff alert popup. */
  newOrderAlert: NewOrderAlertCopy;
  /** Storefront bottom nav shown only below `lg`. */
  mobileBottom?: ReactNode;
};

/**
 * Admin chrome: bottom nav on mobile, dark sidebar on desktop.
 * Single `{children}` tree (no duplicate mounts).
 */
export function AdminShell({
  locale,
  role,
  children,
  newOrderAlert,
  mobileBottom,
}: AdminShellProps) {
  return (
    <NewOrderAlertProvider copy={newOrderAlert}>
      <AdminSidebarCollapseProvider>
        <div className={ADMIN_PAGE_SHELL}>
          <AdminSidebar locale={locale} role={role} />

          <div
            className={
              mobileBottom
                ? "min-w-0 flex-1 px-3 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pt-6 lg:min-h-0 lg:overflow-y-auto lg:overscroll-y-contain lg:px-8 lg:pb-8 lg:pt-12"
                : "min-w-0 flex-1 px-3 pb-8 pt-4 sm:px-6 sm:pt-6 lg:min-h-0 lg:overflow-y-auto lg:overscroll-y-contain lg:px-8 lg:pt-12"
            }
          >
            <div className={ADMIN_MAIN_INNER}>{children}</div>
          </div>

          {mobileBottom ? (
            <div className="contents lg:hidden">{mobileBottom}</div>
          ) : null}
        </div>
      </AdminSidebarCollapseProvider>
    </NewOrderAlertProvider>
  );
}
