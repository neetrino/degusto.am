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
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex shrink-0 justify-center">
          <UserAvatar
            firstName={profile?.firstName}
            lastName={profile?.lastName}
            avatarUrl={profile?.avatarUrl || profile?.avatar || profile?.imageUrl || profile?.image || null}
            size="md"
            className="h-[4.5rem] w-[4.5rem] text-xl shadow-md"
          />
        </div>
        <div className="min-w-0 max-w-full space-y-0.5 px-1">
          {hasSplitName ? (
            <div className="space-y-0.5">
              <p className="text-lg font-semibold leading-snug tracking-tight text-gray-900">
                {profile?.firstName}
              </p>
              <p className="text-xs font-semibold tracking-wide text-gray-600">
                {profile?.lastName}
              </p>
            </div>
          ) : (
            <h1 className="break-words text-xl font-semibold leading-snug tracking-tight text-gray-900">
              {displayName}
            </h1>
          )}
        </div>
      </div>
      <div className="flex w-full flex-col gap-2">
          {profile?.email && (
            <div className="flex items-start gap-2.5 rounded-xl border border-[#F66812]/20 bg-white px-3.5 py-2.5">
              <MailIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#F66812]" />
              <p className="min-w-0 break-words text-sm font-medium leading-relaxed text-gray-700">{profile.email}</p>
            </div>
          )}
          {profile?.phone && (
            <div className="flex items-center gap-2.5 rounded-xl border border-[#F66812]/20 bg-white px-3 py-2.5">
              <PhoneIcon className="h-4 w-4 shrink-0 text-[#F66812]" />
              <p className="min-w-0 text-sm font-medium tabular-nums tracking-wide text-gray-700">{profile.phone}</p>
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
      className="flex flex-col gap-1"
      role="tablist"
      aria-label="Profile sections"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const base = 'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors';
        const stateClasses = isActive
          ? 'border-[#F66812]/30 bg-[#F66812]/10 text-gray-900 shadow-sm'
          : 'border-transparent text-gray-600 hover:border-[#F66812]/20 hover:bg-[#F66812]/[0.06] hover:text-gray-900';

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className={`${base} ${stateClasses}`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                isActive ? 'bg-[#F66812] text-white shadow-sm' : 'bg-gray-100 text-gray-500'
              }`}
            >
              <span className="[&>svg]:h-4 [&>svg]:w-4">{tab.icon}</span>
            </span>
            <span className="min-w-0 flex-1 leading-snug">{tab.label}</span>
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
      className="flex w-full flex-col overflow-hidden rounded-2xl border border-[#F66812]/20 bg-white shadow-sm"
      aria-label="Profile navigation"
    >
      <div className="border-b border-[#F66812]/15 p-5 lg:p-6">
        <ProfileUserIdentity profile={profile} displayName={displayName} />
      </div>
      <div className="p-3">
        <ProfileTabNav tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />
        <div className="mt-2 border-t border-[#F66812]/15 pt-2">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:border-red-100 hover:bg-red-50 hover:text-red-700"
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
