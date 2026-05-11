import { UserAvatar } from '../../components/UserAvatar';
import type { UserProfile, ProfileTab, ProfileTabConfig } from './types';

interface ProfileHeaderProps {
  profile: UserProfile | null;
  tabs: ProfileTabConfig[];
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  onLogout: () => void;
  t: (key: string) => string;
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden={true}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden={true}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function ProfileUserIdentity({
  profile,
  displayName,
}: {
  profile: UserProfile | null;
  displayName: string;
}) {
  const hasSplitName = Boolean(profile?.firstName && profile?.lastName);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-4 text-center sm:gap-4">
        <div className="flex shrink-0 justify-center">
          <UserAvatar
            firstName={profile?.firstName}
            lastName={profile?.lastName}
            avatarUrl={profile?.avatarUrl || profile?.avatar || profile?.imageUrl || profile?.image || null}
            size="md"
            className="shadow-md sm:h-[4.5rem] sm:w-[4.5rem] sm:text-xl"
          />
        </div>
        <div className="min-w-0 max-w-full space-y-0.5 px-1">
          {hasSplitName ? (
            <div className="space-y-0.5">
              <p className="text-[1.0625rem] font-semibold leading-snug tracking-tight text-gray-900 sm:text-lg">
                {profile?.firstName}
              </p>
              <p className="text-xs font-semibold tracking-wide text-gray-600 sm:text-[0.8125rem]">
                {profile?.lastName}
              </p>
            </div>
          ) : (
            <h1 className="text-lg font-semibold leading-snug tracking-tight text-gray-900 break-words sm:text-xl">
              {displayName}
            </h1>
          )}
        </div>
      </div>
      <div className="flex w-full flex-col gap-2">
          {profile?.email && (
            <div className="flex items-start gap-2.5 rounded-xl border border-gray-200/60 bg-white/70 px-3.5 py-2.5 shadow-sm backdrop-blur-sm">
              <MailIcon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <p className="min-w-0 text-xs font-medium leading-relaxed text-gray-700 break-words sm:text-sm">{profile.email}</p>
            </div>
          )}
          {profile?.phone && (
            <div className="flex items-center gap-2.5 rounded-xl border border-gray-200/60 bg-white/70 px-3 py-2.5 shadow-sm backdrop-blur-sm">
              <PhoneIcon className="h-4 w-4 shrink-0 text-gray-400" />
              <p className="min-w-0 text-xs font-medium tabular-nums tracking-wide text-gray-700 sm:text-sm">{profile.phone}</p>
            </div>
          )}
      </div>
    </div>
  );
}

function ProfileTabNav({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: ProfileTabConfig[];
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
}) {
  return (
    <nav
      className="grid grid-cols-2 gap-2 sm:flex sm:flex-col sm:gap-0.5"
      role="tablist"
      aria-label="Profile sections"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const base =
          'flex w-full rounded-md font-medium transition-colors max-sm:min-h-[5.5rem] max-sm:flex-col max-sm:items-center max-sm:justify-center max-sm:gap-1.5 max-sm:px-2 max-sm:py-2.5 max-sm:text-center max-sm:text-[11px] max-sm:leading-snug sm:flex-row sm:items-center sm:gap-3 sm:px-3 sm:py-2 sm:text-left sm:text-sm';
        const activeMobile =
          'max-sm:border-2 max-sm:border-gray-900 max-sm:bg-white max-sm:text-gray-900 max-sm:shadow-sm';
        const inactiveMobile =
          'max-sm:border max-sm:border-gray-300/80 max-sm:bg-white/50 max-sm:text-gray-700 max-sm:hover:border-gray-400 max-sm:hover:bg-white/80';
        const activeDesktop =
          'sm:border-l-[3px] sm:border-gray-900 sm:bg-white/85 sm:pl-[calc(0.75rem-3px)] sm:text-gray-900 sm:shadow-sm';
        const inactiveDesktop =
          'sm:border-l-[3px] sm:border-transparent sm:text-gray-600 sm:hover:bg-white/50 sm:hover:text-gray-900';
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className={`${base} ${isActive ? `${activeMobile} ${activeDesktop}` : `${inactiveMobile} ${inactiveDesktop}`}`}
          >
            <span
              className={`flex shrink-0 items-center justify-center rounded-md max-sm:h-9 max-sm:w-9 sm:h-8 sm:w-8 ${
                isActive ? 'bg-white text-gray-900 shadow-sm max-sm:bg-gray-100' : 'bg-gray-100/80 text-gray-500'
              }`}
            >
              <span className="[&>svg]:h-[18px] [&>svg]:w-[18px] sm:[&>svg]:h-4 sm:[&>svg]:w-4">{tab.icon}</span>
            </span>
            <span className="min-w-0 max-sm:line-clamp-3 sm:flex-1 sm:leading-snug">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function ProfileHeader({ profile, tabs, activeTab, onTabChange, onLogout, t }: ProfileHeaderProps) {
  const displayName =
    profile?.firstName && profile?.lastName
      ? `${profile.firstName} ${profile.lastName}`
      : profile?.firstName
        ? profile.firstName
        : profile?.lastName
          ? profile.lastName
          : t('profile.myProfile');

  return (
    <div
      className="flex w-full flex-col overflow-hidden rounded-2xl border border-gray-300/60 bg-gradient-to-b from-gray-100/95 to-gray-50/90 shadow-inner ring-1 ring-gray-900/[0.04] sm:rounded-xl"
      aria-label="Profile navigation"
    >
      <div className="border-b border-gray-300/50 bg-gray-50/50 p-4 sm:p-5">
        <ProfileUserIdentity profile={profile} displayName={displayName} />
      </div>
      <div className="p-2 sm:bg-gray-50/30 sm:p-3">
        <ProfileTabNav tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />
        <div className="mt-2 border-t border-gray-200/70 pt-2">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-md border-l-[3px] border-transparent px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-500">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
              </svg>
            </span>
            <span className="min-w-0 flex-1 leading-snug">{t('common.navigation.logout')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
