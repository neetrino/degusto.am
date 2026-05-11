'use client';

import { useMemo } from 'react';
import type { AdminMenuItem } from '../../../components/AdminMenuDrawer';
import { usePathname, useRouter } from 'next/navigation';
import { AdminMenuDrawer } from '../../../components/AdminMenuDrawer';
import { BrandLogoLink } from '../../../components/BrandLogoLink';
import { useTranslation } from '../../../lib/i18n-client';
import { getAdminMenuTABS } from '../admin-menu.config';
import {
  ADMIN_SIDEBAR_ASIDE,
  ADMIN_SIDEBAR_MOBILE_DRAWER_WRAP,
  ADMIN_SIDEBAR_NAV,
} from '../admin-sidebar-classes';
import { useAdminSidebarCollapse } from '../context/AdminSidebarCollapseContext';
import { useAdminProductsSubnavExpanded } from '../hooks/useAdminProductsSubnavExpanded';
import { AdminSidebarBrand } from './AdminSidebarBrand';

function isTabPathActive(tabPath: string, pathname: string): boolean {
  return (
    pathname === tabPath ||
    (tabPath === '/supersudo' && pathname === '/supersudo') ||
    (tabPath !== '/supersudo' && pathname.startsWith(tabPath))
  );
}

function isProductsNestedTabVisible(
  tab: AdminMenuItem,
  pathname: string,
  collapsed: boolean,
  productsNestedExpanded: boolean
): boolean {
  if (tab.parentGroupId !== 'products') {
    return true;
  }
  if (collapsed) {
    return true;
  }
  if (isTabPathActive(tab.path, pathname)) {
    return true;
  }
  return productsNestedExpanded;
}

export function AdminSidebar() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname() ?? '/supersudo';
  const adminTabs = useMemo(() => getAdminMenuTABS(t), [t]);
  const { collapsed } = useAdminSidebarCollapse();
  const [productsNestedExpanded, toggleProductsNested] = useAdminProductsSubnavExpanded(pathname);

  const asideWidthClass = collapsed ? 'lg:w-16' : 'lg:w-64';

  return (
    <>
      <div className={ADMIN_SIDEBAR_MOBILE_DRAWER_WRAP}>
        <div className="flex items-center justify-between gap-3">
          <BrandLogoLink className="min-w-0 shrink" />
          <AdminMenuDrawer tabs={adminTabs} currentPath={pathname} />
        </div>
      </div>
      <aside className={`${ADMIN_SIDEBAR_ASIDE} ${asideWidthClass}`}>
        <AdminSidebarBrand />
        <nav
          className={`${ADMIN_SIDEBAR_NAV} ${collapsed ? 'px-1' : 'px-2'}`}
        >
          {adminTabs.map((tab) => {
            if (!isProductsNestedTabVisible(tab, pathname, collapsed, productsNestedExpanded)) {
              return null;
            }

            const isActive = isTabPathActive(tab.path, pathname);
            const rowClasses = `flex w-full items-center rounded-md text-sm font-medium transition-all ${
              collapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'
            } ${tab.isSubCategory && !collapsed ? 'pl-12' : ''} ${
              isActive
                ? 'bg-gray-900 text-white'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`;

            if (tab.id === 'products' && !collapsed) {
              return (
                <div
                  key={tab.id}
                  className={`flex w-full min-w-0 overflow-hidden rounded-md ${
                    isActive ? 'bg-gray-900 text-white' : 'bg-transparent'
                  }`}
                >
                  <button
                    type="button"
                    title={tab.label}
                    onClick={() => {
                      router.push(tab.path);
                    }}
                    className={`flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-all ${
                      isActive
                        ? 'text-white hover:bg-gray-800'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className={`shrink-0 ${isActive ? 'text-white' : 'text-gray-500'}`}>{tab.icon}</span>
                    <span className="min-w-0 truncate">{tab.label}</span>
                  </button>
                  <button
                    type="button"
                    aria-expanded={productsNestedExpanded}
                    aria-label={t('admin.sidebar.toggleProductsNested')}
                    title={t('admin.sidebar.toggleProductsNested')}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleProductsNested();
                    }}
                    className={`shrink-0 border-l px-2 py-3 transition-colors ${
                      isActive
                        ? 'border-white/25 text-white hover:bg-white/10'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <svg
                      className={`h-5 w-5 transition-transform ${productsNestedExpanded ? '' : '-rotate-90'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              );
            }

            return (
              <button
                key={tab.id}
                type="button"
                title={tab.label}
                onClick={() => {
                  router.push(tab.path);
                }}
                className={rowClasses}
              >
                <span className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500'}`}>
                  {tab.icon}
                </span>
                {!collapsed ? <span className="min-w-0 text-left">{tab.label}</span> : null}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
