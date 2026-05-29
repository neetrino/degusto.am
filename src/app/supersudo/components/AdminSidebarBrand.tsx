'use client';

import Link from 'next/link';
import { useTranslation } from '../../../lib/i18n-client';
import { useAdminSidebarCollapse } from '../context/AdminSidebarCollapseContext';

export function AdminSidebarBrand() {
  const { t } = useTranslation();
  const { collapsed, toggleCollapsed } = useAdminSidebarCollapse();

  return (
    <div
      className={`relative mx-3 mt-3 flex shrink-0 border-b border-white/10 pb-4 ${
        collapsed ? 'flex-col items-center gap-3 px-1 pt-2' : 'items-start gap-2 px-1 pt-1'
      }`}
    >
      {collapsed ? (
        <Link
          href="/"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-sm font-semibold tracking-wide text-[#efb54b] backdrop-blur-xl transition-colors hover:bg-white/15"
          title="Degusto"
        >
          Dg
        </Link>
      ) : (
        <Link href="/" className="group min-w-0 flex-1 rounded-2xl px-3 py-3 transition-colors hover:bg-white/5">
          <p className="truncate text-[2.05rem] font-semibold leading-none tracking-tight text-[#df8d36]">
            Degusto
          </p>
          <p className="mt-1 truncate text-[0.6rem] font-medium uppercase tracking-[0.36em] text-[#f7d18f]/90">
            Food Studio
          </p>
        </Link>
      )}
      <button
        type="button"
        onClick={toggleCollapsed}
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white/90 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-white/35 hover:bg-white/15 hover:text-white ${
          collapsed ? '' : 'self-start'
        }`}
        aria-expanded={!collapsed}
        aria-label={collapsed ? t('admin.sidebar.expand') : t('admin.sidebar.collapse')}
        title={collapsed ? t('admin.sidebar.expand') : t('admin.sidebar.collapse')}
      >
        {collapsed ? (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        )}
      </button>
    </div>
  );
}
