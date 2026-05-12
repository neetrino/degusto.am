'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

/**
 * Renders a mobile-friendly admin hamburger menu that mirrors the desktop sidebar.
 */
export function AdminMenuDrawer({ tabs, currentPath }: AdminMenuDrawerProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const pathname = currentPath || '/supersudo';
  const [productsNestedExpanded, toggleProductsNested] = useAdminProductsSubnavExpanded(pathname);

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
        className="inline-flex items-center gap-2 rounded-full border border-[#e85c0a] bg-[#f66812] px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white shadow-sm"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6H20M4 12H16M4 18H12" />
        </svg>
        Menu
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            id="admin-menu-drawer-panel"
            className="admin-sidebar-home-bg flex h-full min-h-screen w-1/2 min-w-[16rem] max-w-full flex-col bg-[#f66812] text-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#e85c0a] px-4 py-4">
              <BrandLogoLink onDark className="min-w-0" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-10 w-10 rounded-full border border-white/30 text-white/90 hover:border-white/50 hover:bg-black/10 hover:text-white"
                aria-label="Close admin menu"
              >
                <svg className="mx-auto h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 divide-y divide-black/10 overflow-y-auto">
              {tabs.map((tab) => {
                if (!isDrawerNestedProductTabVisible(tab, pathname, productsNestedExpanded)) {
                  return null;
                }

                const isActive = isDrawerTabPathActive(tab.path, pathname);

                if (tab.id === 'products') {
                  return (
                    <div
                      key={tab.id}
                      className={`flex w-full min-w-0 items-stretch ${isActive ? 'bg-white text-[#f66812] shadow-sm' : ''}`}
                    >
                      <button
                        type="button"
                        onClick={() => handleNavigate(tab.path)}
                        className={`flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium ${
                          isActive ? 'text-[#f66812] hover:bg-[#fff4eb]' : 'text-white/95 hover:bg-black/10 hover:text-white'
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span className={isActive ? 'text-[#f66812]' : 'text-white/85'}>{tab.icon}</span>
                          <span className="min-w-0 truncate">{tab.label}</span>
                        </span>
                        <svg
                          className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#f66812]' : 'text-white/75'}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
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
                        className={`shrink-0 border-l px-3 py-3 ${
                          isActive
                            ? 'border-[#ffd9c0] text-[#f66812] hover:bg-[#fff4eb]'
                            : 'border-white/20 text-white/85 hover:bg-black/10 hover:text-white'
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
                    onClick={() => handleNavigate(tab.path)}
                    className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium ${
                      tab.isSubCategory ? 'pl-8' : ''
                    } ${isActive ? 'bg-white text-[#f66812] shadow-sm' : 'text-white/95 hover:bg-black/10 hover:text-white'}`}
                  >
                    <span className="flex items-center gap-3">
                      <span className={isActive ? 'text-[#f66812]' : 'text-white/85'}>{tab.icon}</span>
                      {tab.label}
                    </span>
                    <svg
                      className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#f66812]' : 'text-white/75'}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


