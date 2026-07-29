import { notFound } from "next/navigation";

import { ProfileMobileShell } from "@/features/profile/ui/ProfileMobileShell";
import { ProfileSidebar } from "@/features/profile/ui/ProfileSidebar";
import { requireUser } from "@/lib/auth/policies";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type ProfileLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

/** Profile shell — wide Degusto frame with rounded back panel (desktop). */
export default async function ProfileLayout({
  children,
  params,
}: ProfileLayoutProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const user = await requireUser(rawLocale);
  const dictionary = getDictionary(rawLocale);

  return (
    <div className="profile-desktop-page min-h-full bg-transparent lg:flex lg:flex-1 lg:flex-col">
      <div className="mx-auto flex w-full max-w-[min(1450px,calc(100%-2rem))] flex-1 flex-col md:max-w-[min(1450px,calc(100%-2.5rem))] lg:max-w-[min(1450px,calc(100%-3rem))]">
        <div className="flex flex-1 flex-col lg:rounded-[36px] lg:border lg:border-brand/15 lg:bg-[#faf7f4] lg:p-5 lg:shadow-[0_24px_60px_-36px_rgba(28,25,23,0.4)] xl:rounded-[40px] xl:p-6">
          <div className="grid flex-1 grid-cols-1 items-stretch gap-5 lg:grid-cols-12 xl:gap-7">
            <div className="hidden lg:col-span-4 lg:flex xl:col-span-3">
              <ProfileSidebar
                locale={rawLocale}
                user={user}
                dictionary={dictionary.profile}
              />
            </div>

            <ProfileMobileShell
              locale={rawLocale}
              user={user}
              dictionary={dictionary.profile}
              homeLabel={dictionary.nav.home}
            >
              {children}
            </ProfileMobileShell>
          </div>
        </div>
      </div>
    </div>
  );
}
