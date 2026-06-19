'use client';

import { useEffect, type ReactNode } from 'react';
import { Home } from 'lucide-react';
import { UserAvatar } from '../../components/UserAvatar';
import type { ProfileTab, ProfileTabConfig, UserProfile } from './types';

interface ProfileMobilePageProps {
  profile: UserProfile | null;
  tabs: ProfileTabConfig[];
  activeTab: ProfileTab;
  onTabSelect: (_tab: ProfileTab) => void;
  onLogout: () => void;
  t: (_key: string) => string;
  isSheetOpen: boolean;
  onCloseSheet: () => void;
  children: ReactNode;
}

function getDisplayName(profile: UserProfile | null, t: (_key: string) => string): string {
  if (profile?.firstName && profile?.lastName) {
    return `${profile.firstName} ${profile.lastName}`;
  }
  return profile?.firstName || profile?.lastName || t('profile.myProfile');
}

export function ProfileMobilePage({
  profile,
  tabs,
  activeTab,
  onTabSelect,
  onLogout,
  t,
  isSheetOpen,
  onCloseSheet,
  children,
}: ProfileMobilePageProps) {
  const displayName = getDisplayName(profile, t);
  const activeTabLabel = tabs.find((tab) => tab.id === activeTab)?.label ?? t('profile.myProfile');
  const dashboardTab = tabs.find((tab) => tab.id === 'dashboard');
  const passwordTab = tabs.find((tab) => tab.id === 'password');
  const otherTabs = tabs.filter((tab) => tab.id !== 'dashboard' && tab.id !== 'password');

  useEffect(() => {
    if (!isSheetOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isSheetOpen]);

  return (
    <div className="mx-auto w-full max-w-md max-lg:px-4 px-4 pb-2 pt-6 lg:hidden">
      <div className="mb-5 flex items-center gap-4">
        <UserAvatar
          firstName={profile?.firstName}
          lastName={profile?.lastName}
          avatarUrl={profile?.avatarUrl || profile?.avatar || profile?.imageUrl || profile?.image || null}
          size="lg"
          className="h-20 w-20 text-xl"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xl font-semibold text-gray-900">{displayName}</p>
          {profile?.email && <p className="truncate text-sm text-gray-600">{profile.email}</p>}
        </div>
      </div>

      <div className="divide-y divide-gray-100 rounded-2xl border border-gray-200/80 bg-white">
          {dashboardTab && (
            <>
              <button
                type="button"
                onClick={() => onTabSelect(dashboardTab.id)}
                className="flex w-full items-center justify-between px-4 py-3.5 text-left"
              >
                <span className="flex items-center gap-3 text-base font-medium text-gray-800">
                  <span className="text-gray-500">
                    <Home className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  Home
                </span>
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
          {otherTabs
            .filter((tab) => tab.id !== 'deleteAccount')
            .map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabSelect(tab.id)}
                className="flex w-full items-center justify-between px-4 py-3.5 text-left"
              >
                <span className="flex items-center gap-3 text-base font-medium text-gray-800">
                  <span className="text-gray-500">{tab.icon}</span>
                  {tab.label}
                </span>
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          {passwordTab && (
            <button
              type="button"
              onClick={() => onTabSelect(passwordTab.id)}
              className="flex w-full items-center justify-between px-4 py-3.5 text-left"
            >
              <span className="flex items-center gap-3 text-base font-medium text-gray-800">
                <span className="text-gray-500">{passwordTab.icon}</span>
                {passwordTab.label}
              </span>
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          {otherTabs
            .filter((tab) => tab.id === 'deleteAccount')
            .map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabSelect(tab.id)}
              className="flex w-full items-center justify-between px-4 py-3.5 text-left"
            >
              <span className="flex items-center gap-3 text-base font-medium text-gray-800">
                <span className="text-gray-500">{tab.icon}</span>
                {tab.label}
              </span>
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center justify-between px-4 py-3.5 text-left text-red-600"
          >
            <span className="text-base font-semibold">{t('common.navigation.logout')}</span>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

      {isSheetOpen && (
        <div className="fixed inset-0 z-[70] flex items-end bg-black/35 backdrop-blur-[1px]" onClick={onCloseSheet}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={activeTabLabel}
            className="h-[72vh] w-full rounded-t-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mt-2 h-1.5 w-14 rounded-full bg-gray-300" />
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">{activeTabLabel}</h2>
              <button
                type="button"
                onClick={onCloseSheet}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600"
                aria-label={t('profile.orderDetails.close')}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="h-[calc(72vh-4.75rem)] overflow-y-auto px-4 py-4">{children}</div>
          </div>
        </div>
      )}
    </div>
  );
}
