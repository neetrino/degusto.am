import { Mail } from "lucide-react";

import { ProfileSidebarNav } from "@/features/profile/ui/ProfileSidebarNav";
import { logoutAction } from "@/features/auth/logout-action";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { SessionUser } from "@/lib/auth/session";

type ProfileSidebarProps = {
  locale: Locale;
  user: SessionUser;
  dictionary: Dictionary["profile"];
};

/** Desktop profile sidebar — Degusto branded panel. */
export function ProfileSidebar({
  locale,
  user,
  dictionary,
}: ProfileSidebarProps) {
  const logoutWithLocale = logoutAction.bind(null, locale);
  const initials = `${user.firstName.slice(0, 1)}${user.lastName.slice(0, 1)}`.toUpperCase();
  const displayName = `${user.firstName} ${user.lastName}`.trim();

  return (
    <aside
      className="relative flex w-full flex-col rounded-[28px] border border-brand/20 bg-white shadow-[0_18px_50px_-28px_rgba(246,104,18,0.45)] lg:h-full lg:min-h-[560px]"
      aria-label={dictionary.title}
    >
      <div className="relative shrink-0 border-b border-brand/10 px-5 pt-7 pb-6 sm:px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-[5.25rem] w-[5.25rem] items-center justify-center rounded-full bg-brand text-2xl font-black tracking-wide text-white shadow-[0_12px_28px_-10px_rgba(246,104,18,0.85)] ring-4 ring-white">
            {initials}
          </div>

          <div className="space-y-1">
            <p className="font-display text-xl font-black tracking-tight text-product-ink">
              {displayName}
            </p>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-brand uppercase">
              {dictionary.title}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2.5 rounded-2xl border border-brand/15 bg-[#fff7f0] px-3.5 py-3 text-left shadow-sm">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand">
            <Mail className="size-3.5" aria-hidden />
          </span>
          <p className="min-w-0 flex-1 truncate text-xs font-medium text-product-ink/80 sm:text-sm">
            {user.email}
          </p>
        </div>
      </div>

      <div className="relative flex-1 bg-white">
        <ProfileSidebarNav
          locale={locale}
          dictionary={dictionary}
          logoutAction={logoutWithLocale}
        />
      </div>
    </aside>
  );
}
