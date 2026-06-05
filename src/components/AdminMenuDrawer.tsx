'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ADMIN_SIDEBAR_SCROLLBAR } from '../app/supersudo/admin-sidebar-classes';
import { useAdminProductsSubnavExpanded } from '../app/supersudo/hooks/useAdminProductsSubnavExpanded';
import { useTranslation } from '../lib/i18n-client';
import { BrandLogoLink } from './BrandLogoLink';

export interface AdminMenuItem {
  id: string;
  label: string;
  path: string;
  icon: ReactNode;
  isSubCategory?: boolean;
  /** Nested under Products; visibility controlled by expand/collapse toggle */
  parentGroupId?: 'products';
}

interface AdminMenuDrawerProps {
  tabs: AdminMenuItem[];
  currentPath: string;
}

function isDrawerTabPathActive(tabPath: string, pathname: string): boolean {
  return (
    pathname === tabPath ||
    (tabPath === '/supersudo' && pathname === '/supersudo') ||
    (tabPath !== '/supersudo' && pathname.startsWith(tabPath))
  );
}

function isDrawerNestedProductTabVisible(
  tab: AdminMenuItem,
  pathname: string,
  productsNestedExpanded: boolean
): boolean {
  if (tab.parentGroupId !== 'products') {
    return true;
  }
  if (isDrawerTabPathActive(tab.path, pathname)) {
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

/**
 * Renders a mobile-friendly admin hamburger menu that mirrors the desktop sidebar.
 */
export function AdminMenuDrawer({ tabs, currentPath }: AdminMenuDrawerProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const pathname = currentPath || '/supersudo';
  const [productsNestedExpanded, toggleProductsNested] = useAdminProductsSubnavExpanded(pathname);
  const topLevelTabs = tabs.filter((tab) => !tab.parentGroupId);
  const productsNestedTabs = tabs.filter((tab) => tab.parentGroupId === 'products');
  const groupedTabs = {
    primary: topLevelTabs.filter((tab) => getSectionForTab(tab.id) === 'primary'),
    insights: topLevelTabs.filter((tab) => getSectionForTab(tab.id) === 'insights'),
    system: topLevelTabs.filter((tab) => getSectionForTab(tab.id) === 'system'),
  };

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  /**
   * Handles navigation button clicks inside the drawer.
   */
  const handleNavigate = (path: string) => {
    router.push(path);
    setOpen(false);
  };

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="admin-menu-drawer-panel"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-[#0b3a28] px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white shadow-[0_10px_30px_rgba(3,20,15,0.35)]"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6H20M4 12H16M4 18H12" />
        </svg>
        Menu
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex bg-black/65 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        >
          <div
            id="admin-menu-drawer-panel"
            className="admin-sidebar-home-bg flex h-full min-h-screen w-[85vw] max-w-[340px] flex-col border-r border-white/10 bg-[#062c20] text-white shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4">
              <BrandLogoLink onDark className="min-w-0 rounded-xl px-1 py-1" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-10 w-10 rounded-xl border border-white/20 bg-white/10 text-white/90 backdrop-blur-xl hover:border-white/40 hover:bg-white/15 hover:text-white"
                aria-label="Close admin menu"
              >
                <svg className="mx-auto h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className={`${ADMIN_SIDEBAR_SCROLLBAR} flex-1 overflow-y-auto px-3 py-3`}>
              {[groupedTabs.primary, groupedTabs.insights, groupedTabs.system].map((groupTabs, groupIndex) => (
                <div key={groupIndex} className="space-y-1.5 pb-2">
                  {groupTabs.map((tab) => {
                    if (!isDrawerNestedProductTabVisible(tab, pathname, productsNestedExpanded)) {
                      return null;
                    }

                    const isActive = isDrawerTabPathActive(tab.path, pathname);
                    const rowClasses = `group flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'border-[rgba(120,255,160,0.35)] bg-[linear-gradient(90deg,rgba(35,180,90,0.35),rgba(23,100,60,0.45))] text-white shadow-[0_8px_30px_rgba(0,0,0,0.22),inset_0_0_18px_rgba(90,255,140,0.10)]'
                        : 'border-transparent bg-transparent text-white/90 hover:translate-x-0.5 hover:border-white/15 hover:bg-white/10 hover:text-white'
                    }`;

                    if (tab.id === 'products') {
                      return (
                        <div key={tab.id} className="space-y-1">
                          <div className={rowClasses}>
                            <button
                              type="button"
                              onClick={() => handleNavigate(tab.path)}
                              className="flex min-w-0 flex-1 items-center gap-3"
                            >
                              <span className={`shrink-0 [&>svg]:h-6 [&>svg]:w-6 ${isActive ? 'text-[#bdf28b]' : 'text-white/75'}`}>
                                {tab.icon}
                              </span>
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
                              className="rounded-xl border border-white/15 bg-black/10 p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
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
                          </div>
                          <div
                            className={`overflow-hidden transition-[max-height,opacity] duration-300 ${
                              productsNestedExpanded ? 'max-h-72 opacity-100' : 'max-h-0 opacity-0'
                            }`}
                          >
                            <div className="relative rounded-[18px] border border-white/10 bg-white/[0.04] px-2.5 py-2 backdrop-blur-xl">
                              <span className="absolute bottom-4 left-[18px] top-4 w-px rounded-full bg-white/20" />
                              {productsNestedTabs.map((nestedTab) => {
                                const nestedActive = isDrawerTabPathActive(nestedTab.path, pathname);
                                return (
                                  <button
                                    key={nestedTab.id}
                                    type="button"
                                    onClick={() => handleNavigate(nestedTab.path)}
                                    className={`relative flex w-full items-center rounded-xl py-2.5 pl-7 pr-3 text-left text-sm font-medium ${
                                      nestedActive
                                        ? 'bg-white/12 text-white'
                                        : 'text-white/75 hover:bg-white/10 hover:text-white'
                                    }`}
                                  >
                                    <span
                                      className={`absolute left-[10px] h-2.5 w-2.5 rounded-full ${
                                        nestedActive
                                          ? 'bg-[#9eff8e] shadow-[0_0_0_4px_rgba(118,255,156,0.2),0_0_16px_rgba(158,255,142,0.9)]'
                                          : 'bg-white/35'
                                      }`}
                                    />
                                    <span className="truncate">{nestedTab.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <button key={tab.id} type="button" onClick={() => handleNavigate(tab.path)} className={rowClasses}>
                        <span className={`shrink-0 [&>svg]:h-6 [&>svg]:w-6 ${isActive ? 'text-[#bdf28b]' : 'text-white/75'}`}>
                          {tab.icon}
                        </span>
                        <span className="truncate">{tab.label}</span>
                      </button>
                    );
                  })}
                  {groupIndex < 2 ? <div className="mx-2 border-t border-white/10 pt-1" /> : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


