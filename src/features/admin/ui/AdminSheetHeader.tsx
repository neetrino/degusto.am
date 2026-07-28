import type { ReactNode } from "react";

import {
  ADMIN_SHEET_HEADER,
  ADMIN_SHEET_SUBTITLE,
  ADMIN_SHEET_TITLE,
} from "@/features/admin/ui/admin-form-classes";

type AdminSheetHeaderProps = {
  title: string;
  subtitle?: string | null;
  children?: ReactNode;
};

/** Degusto-styled sheet header with brand orange accent bar. */
export function AdminSheetHeader({
  title,
  subtitle,
  children,
}: AdminSheetHeaderProps) {
  return (
    <div className={ADMIN_SHEET_HEADER}>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#ff7f20] via-[#ffb067] to-transparent"
        aria-hidden
      />
      <h2 className={ADMIN_SHEET_TITLE}>{title}</h2>
      {subtitle ? <p className={ADMIN_SHEET_SUBTITLE}>{subtitle}</p> : null}
      {children}
    </div>
  );
}
