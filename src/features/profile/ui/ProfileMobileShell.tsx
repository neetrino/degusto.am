"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { ProfileMobileHub } from "@/features/profile/ui/ProfileMobileHub";
import { ProfileMobileTabSheet } from "@/features/profile/ui/ProfileMobileTabSheet";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { SessionUser } from "@/lib/auth/session";

type ProfileMobileShellProps = {
  locale: Locale;
  user: SessionUser;
  dictionary: Dictionary["profile"];
  homeLabel: string;
  children: ReactNode;
};

function isProfileHubPath(pathname: string, locale: Locale): boolean {
  const hubHref = `/${locale}/profile`;
  return pathname === hubHref || pathname === `${hubHref}/`;
}

/**
 * Mobile profile shell: hub always visible; section content in a bottom sheet.
 * Desktop content column uses Degusto reference card frame (`lg+`).
 */
export function ProfileMobileShell({
  locale,
  user,
  dictionary,
  homeLabel,
  children,
}: ProfileMobileShellProps) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const isHub = isProfileHubPath(pathname, locale);
  const [hubSheetOpen, setHubSheetOpen] = useState(false);
  /** Keeps sub-route content mounted while the close keyframe plays. */
  const [closingToHub, setClosingToHub] = useState(false);
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 820px)");
    function sync(): void {
      setIsDesktop(media.matches);
    }
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!isHub) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setHubSheetOpen(false);
      setClosingToHub(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isHub, pathname]);

  const sheetOpen = (!isHub || hubSheetOpen) && !closingToHub;

  const closeSheet = useCallback(() => {
    if (isHub) {
      setHubSheetOpen(false);
      return;
    }
    setClosingToHub(true);
  }, [isHub]);

  const handleSheetExited = useCallback(() => {
    if (!closingToHub) return;
    // Keep `closingToHub` true until the hub route mounts — otherwise
    // `sheetOpen` flips back on and the sheet re-opens with a jerk.
    router.push(`/${locale}/profile`);
  }, [closingToHub, locale, router]);

  const openHubDashboard = useCallback(() => {
    setHubSheetOpen(true);
  }, []);

  const hub = (
    <ProfileMobileHub
      locale={locale}
      user={user}
      dictionary={dictionary}
      homeLabel={homeLabel}
      onOpenDashboard={openHubDashboard}
    />
  );

  const desktopColumn = (
    <div className="hidden min-w-0 lg:col-span-8 lg:block xl:col-span-9">
      <div className="h-full min-h-[560px] rounded-[28px] border border-brand/20 bg-white p-5 shadow-[0_18px_50px_-28px_rgba(28,25,23,0.35)] sm:p-7">
        {children}
      </div>
    </div>
  );

  // SSR / pre-hydration: hub on mobile via CSS; content only from lg up.
  if (isDesktop === null) {
    return (
      <>
        <div className="profile-mobile-page mx-auto w-full max-w-none px-1.5 pt-6 pb-8 sm:px-2 lg:hidden">
          {hub}
        </div>
        <div className="hidden min-w-0 lg:col-span-8 lg:block xl:col-span-9">
          <div className="h-full min-h-[560px] rounded-[28px] border border-brand/20 bg-white p-5 shadow-[0_18px_50px_-28px_rgba(28,25,23,0.35)] sm:p-7">
            {children}
          </div>
        </div>
      </>
    );
  }

  if (isDesktop) {
    return desktopColumn;
  }

  return (
    <div className="profile-mobile-page mx-auto w-full max-w-none px-1.5 pt-6 pb-8 sm:px-2">
      {hub}
      <ProfileMobileTabSheet
        open={sheetOpen}
        onClose={closeSheet}
        onExited={handleSheetExited}
        ariaLabel={dictionary.title}
      >
        {children}
      </ProfileMobileTabSheet>
    </div>
  );
}
