'use client';

import { useEffect, useMemo } from 'react';
import type { AdminMenuItem } from '../../../components/AdminMenuDrawer';
import { usePathname, useRouter } from 'next/navigation';
import { AdminMenuDrawer } from '../../../components/AdminMenuDrawer';
import { useTranslation } from '../../../lib/i18n-client';
import { LANGUAGES, type LanguageCode, setStoredLanguage } from '../../../lib/language';
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

function getSectionForTab(tabId: string): 'primary' | 'insights' | 'system' {
  if (tabId === 'analytics' || tabId === 'price-filter-settings' || tabId === 'delivery') {
    return 'insights';
  }
  if (tabId === 'messages' || tabId === 'settings') {
    return 'system';
  }
  return 'primary';
}

export function AdminSidebar() {
  const { t, lang } = useTranslation();
  const router = useRouter();
  const pathname = usePathname() ?? '/supersudo';
  const adminTabs = useMemo(() => getAdminMenuTABS(t), [t]);
  const { collapsed } = useAdminSidebarCollapse();
  const [productsNestedExpanded, toggleProductsNested] = useAdminProductsSubnavExpanded(pathname);

  const asideWidthClass = collapsed ? 'lg:w-[94px]' : 'lg:w-[312px]';
  const menuGroups = useMemo(() => {
    const topLevel = adminTabs.filter((tab) => !tab.parentGroupId);
    return {
      primary: topLevel.filter((tab) => getSectionForTab(tab.id) === 'primary'),
      insights: topLevel.filter((tab) => getSectionForTab(tab.id) === 'insights'),
      system: topLevel.filter((tab) => getSectionForTab(tab.id) === 'system'),
      productsNested: adminTabs.filter((tab) => tab.parentGroupId === 'products'),
    };
  }, [adminTabs]);

  const prefetchPaths = useMemo(() => {
    return Array.from(new Set(adminTabs.map((tab) => tab.path)));
  }, [adminTabs]);

  useEffect(() => {
    for (const path of prefetchPaths) {
      router.prefetch(path);
    }
  }, [prefetchPaths, router]);

  function navigateTo(path: string): void {
    if (pathname === path) {
      return;
    }
    router.push(path);
  }

  function prefetchPath(path: string): void {
    router.prefetch(path);
  }

  function changeAdminLanguage(nextLanguage: LanguageCode): void {
    if (nextLanguage === lang) {
      return;
    }
    setStoredLanguage(nextLanguage);
  }

  return (
    <>
      <div className={ADMIN_SIDEBAR_MOBILE_DRAWER_WRAP}>
        <div className="flex items-center justify-between gap-3">
          <div className="rounded-2xl border border-white/15 bg-[#062c20] px-4 py-2 text-white shadow-[0_10px_30px_rgba(2,21,15,0.35)]">
            <p className="text-lg font-semibold leading-none tracking-tight text-[#df8d36]">Degusto</p>
            <p className="mt-0.5 text-[0.55rem] uppercase tracking-[0.3em] text-[#f7d18f]/85">Food Studio</p>
          </div>
          <AdminMenuDrawer tabs={adminTabs} currentPath={pathname} />
        </div>
      </div>
      <aside className={`${ADMIN_SIDEBAR_ASIDE} ${asideWidthClass}`}>
        <AdminSidebarBrand />
        <nav className={`${ADMIN_SIDEBAR_NAV} ${collapsed ? 'px-2' : 'px-3'}`}>
          {[menuGroups.primary, menuGroups.insights, menuGroups.system].map((groupTabs, groupIndex) => (
            <div key={groupIndex} className="space-y-1.5">
              {groupTabs.map((tab) => {
                if (!isProductsNestedTabVisible(tab, pathname, collapsed, productsNestedExpanded)) {
                  return null;
                }

                const isActive = isTabPathActive(tab.path, pathname);
                const iconClasses = isActive ? 'text-[#bdf28b]' : 'text-white/75';
                const rowClasses = `group relative flex w-full items-center overflow-hidden rounded-2xl border text-[0.97rem] font-medium transition-all duration-300 ${
                  collapsed ? 'justify-center px-2 py-3.5' : 'gap-3.5 px-4 py-3.5'
                } ${
                  isActive
                    ? 'border-[rgba(120,255,160,0.35)] bg-[linear-gradient(90deg,rgba(35,180,90,0.35),rgba(23,100,60,0.45))] text-white shadow-[0_8px_30px_rgba(0,0,0,0.22),inset_0_0_18px_rgba(90,255,140,0.10)]'
                    : 'border-transparent bg-transparent text-white/90 hover:translate-x-0.5 hover:border-white/15 hover:bg-white/10 hover:text-white'
                }`;

                if (tab.id === 'products') {
                  return (
                    <div key={tab.id} className="space-y-0.5">
                      <div className={rowClasses}>
                        <button
                          type="button"
                          title={tab.label}
                          onClick={() => {
                            navigateTo(tab.path);
                          }}
                          onMouseEnter={() => prefetchPath(tab.path)}
                          onFocus={() => prefetchPath(tab.path)}
                          className={`flex min-w-0 flex-1 items-center ${collapsed ? 'justify-center' : 'gap-3.5'} text-left`}
                        >
                          <span className={`shrink-0 [&>svg]:h-6 [&>svg]:w-6 ${iconClasses}`}>{tab.icon}</span>
                          {!collapsed ? <span className="min-w-0 truncate">{tab.label}</span> : null}
                        </button>
                        {!collapsed ? (
                          <button
                            type="button"
                            aria-expanded={productsNestedExpanded}
                            aria-label={t('admin.sidebar.toggleProductsNested')}
                            title={t('admin.sidebar.toggleProductsNested')}
                            onClick={(e) => {
                              e.preventDefault();
                              toggleProductsNested();
                            }}
                            className="ml-1 rounded-xl border border-white/15 bg-black/10 p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                          >
                            <svg
                              className={`h-5 w-5 transition-transform duration-300 ${productsNestedExpanded ? '' : '-rotate-90'}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        ) : null}
                      </div>
                      {!collapsed ? (
                        <div
                          className={`overflow-hidden transition-[max-height,opacity,margin] duration-300 ease-out ${
                            productsNestedExpanded ? 'mt-2 max-h-72 opacity-100' : 'max-h-0 opacity-0'
                          }`}
                        >
                          <div className="relative rounded-[18px] border border-white/10 bg-white/[0.04] px-3 py-2 backdrop-blur-xl">
                            <span className="absolute bottom-4 left-[22px] top-4 w-px rounded-full bg-white/20" />
                            {menuGroups.productsNested.map((nestedTab) => {
                              const nestedActive = isTabPathActive(nestedTab.path, pathname);
                              return (
                                <button
                                  key={nestedTab.id}
                                  type="button"
                                  title={nestedTab.label}
                                  onClick={() => {
                                    navigateTo(nestedTab.path);
                                  }}
                                  onMouseEnter={() => prefetchPath(nestedTab.path)}
                                  onFocus={() => prefetchPath(nestedTab.path)}
                                  className={`relative flex w-full items-center gap-3 rounded-xl py-2.5 pl-8 pr-3 text-left text-sm font-medium transition-all duration-300 ${
                                    nestedActive
                                      ? 'bg-white/12 text-white'
                                      : 'text-white/75 hover:bg-white/10 hover:text-white'
                                  }`}
                                >
                                  <span
                                    className={`absolute left-[13px] h-2.5 w-2.5 rounded-full transition-all ${
                                      nestedActive
                                        ? 'bg-[#9eff8e] shadow-[0_0_0_4px_rgba(118,255,156,0.2),0_0_16px_rgba(158,255,142,0.9)]'
                                        : 'bg-white/35'
                                    }`}
                                  />
                                  <span className="min-w-0 truncate">{nestedTab.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                }

                return (
                  <button
                    key={tab.id}
                    type="button"
                    title={tab.label}
                    onClick={() => {
                      navigateTo(tab.path);
                    }}
                    onMouseEnter={() => prefetchPath(tab.path)}
                    onFocus={() => prefetchPath(tab.path)}
                    className={rowClasses}
                  >
                    <span className={`shrink-0 [&>svg]:h-6 [&>svg]:w-6 ${iconClasses}`}>{tab.icon}</span>
                    {!collapsed ? <span className="min-w-0 truncate text-left">{tab.label}</span> : null}
                  </button>
                );
              })}
              {groupIndex < 2 ? <div className="mx-3 border-t border-white/10 pt-1.5" /> : null}
            </div>
          ))}
        </nav>
        <div className={`${collapsed ? 'px-2 pb-4' : 'px-3 pb-4'}`}>
          <div
            className={`rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-xl ${
              collapsed ? 'p-2' : 'px-3 py-2.5'
            }`}
          >
            {!collapsed ? (
              <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-white/65">Language</p>
            ) : null}
            <div className={`grid ${collapsed ? 'grid-cols-1 gap-1.5' : 'grid-cols-3 gap-1.5'}`}>
              {(Object.keys(LANGUAGES) as LanguageCode[]).map((languageCode) => {
                const isActive = lang === languageCode;
                return (
                  <button
                    key={languageCode}
                    type="button"
                    onClick={() => changeAdminLanguage(languageCode)}
                    className={`rounded-xl border px-2 py-2 text-center text-xs font-semibold transition-colors ${
                      isActive
                        ? 'border-[rgba(120,255,160,0.35)] bg-[linear-gradient(90deg,rgba(35,180,90,0.35),rgba(23,100,60,0.45))] text-white'
                        : 'border-white/15 bg-black/10 text-white/75 hover:border-white/30 hover:text-white'
                    }`}
                    aria-label={`Switch language to ${LANGUAGES[languageCode].name}`}
                    title={LANGUAGES[languageCode].nativeName}
                  >
                    {languageCode.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
