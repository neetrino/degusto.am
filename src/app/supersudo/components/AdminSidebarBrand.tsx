'use client';

import { BrandLogoLink } from '../../../components/BrandLogoLink';
import { useTranslation } from '../../../lib/i18n-client';
import { useAdminSidebarCollapse } from '../context/AdminSidebarCollapseContext';

export function AdminSidebarBrand() {
  const { t } = useTranslation();
  const { collapsed, toggleCollapsed } = useAdminSidebarCollapse();

  return (
    <div
      className={`flex shrink-0 border-b border-[#dd5a0b] pb-3 pt-2 ${
        collapsed
          ? 'flex-col items-center gap-2 px-1'
          : 'items-center gap-1 px-2'
      }`}
    >
      {collapsed ? (
        <BrandLogoLink compact onDark className="shrink-0" />
      ) : (
        <BrandLogoLink onDark className="min-w-0 flex-1 justify-center rounded-md px-2 py-2 hover:bg-black/10" />
      )}
      <button
        type="button"
        onClick={toggleCollapsed}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/30 text-[#184d3a] transition-colors hover:border-emerald-200 hover:bg-emerald-600/25 hover:text-[#0b2a1f]"
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
