import type { ReactNode } from "react";
import { ChefHat } from "lucide-react";

import { StorefrontMobileChrome } from "@/components/layout/StorefrontMobileChrome";
import type { Locale } from "@/lib/i18n/config";

type AuthMobileChromeProps = {
  locale: Locale;
  brand: string;
  callLabel: string;
  phoneHref: string;
  languageLabel: string;
  searchLabel: string;
  searchPlaceholder: string;
};

type AuthPageShellProps = {
  children: ReactNode;
  mobileChrome: AuthMobileChromeProps;
};

/** Phone `tel:` href from footer phones string (first number). */
export function firstAuthPhoneHref(phones: string): string {
  const match = phones.match(/\d[\d\s()-]{5,}/);
  if (!match) {
    return "tel:+37460388080";
  }
  const digits = match[0].replace(/\D/g, "");
  return `tel:+${digits.startsWith("0") ? `374${digits.slice(1)}` : digits}`;
}

/**
 * Auth canvas — mobile orange chrome + cream sheet; desktop transparent over shell hero.
 */
export function AuthPageShell({ children, mobileChrome }: AuthPageShellProps) {
  return (
    <div data-auth-page className="bg-[#FBF6EA] lg:bg-transparent">
      <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen lg:hidden">
        <StorefrontMobileChrome
          {...mobileChrome}
          sheetClassName="bg-[#FBF6EA]"
          sheetSpacingClassName="mt-5 flex-1 px-4 pt-3 pb-[6.75rem]"
        >
          {children}
        </StorefrontMobileChrome>
      </div>

      <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] -mt-[7.5rem] hidden w-screen flex-1 flex-col lg:flex">
        <div className="relative z-10 flex min-h-[calc(100dvh-7.5rem)] flex-1 flex-col justify-center overflow-visible bg-transparent pt-[7.5rem] pb-16">
          <div className="relative z-10 mx-auto w-full max-w-[34rem] px-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

type AuthCardProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

/** Cream gradient auth card with chef-hat badge — Degusto login/register. */
export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="relative overflow-visible rounded-[28px] border border-[#FFE5CF] bg-[linear-gradient(168deg,#fffef9_0%,#fff7eb_44%,#ffeed9_100%)] px-4 pt-6 pb-7 shadow-[0_24px_60px_rgba(50,24,0,0.16)] sm:rounded-[32px] sm:p-8 lg:rounded-[40px] lg:px-10 lg:pt-11 lg:pb-10 lg:shadow-[0_28px_70px_rgba(50,24,0,0.22)]">
      <header className="mb-5 text-center sm:mb-8">
        <div className="mb-2 flex justify-center sm:mb-5">
          <div className="rounded-full bg-[#f4dfbf] p-1 shadow-[0_10px_22px_rgba(49,27,0,0.2)]">
            <div className="flex size-14 items-center justify-center rounded-full bg-[#1f3a22] text-[#fff2d8] shadow-[inset_0_0_0_1px_rgba(255,235,200,0.28)] sm:size-16">
              <ChefHat className="size-7 sm:size-8" aria-hidden />
            </div>
          </div>
        </div>
        <h1 className="text-center text-[1.5rem] leading-[1.15] font-bold tracking-tight text-[#16331f] sm:text-[32px]">
          {title}
        </h1>
        <p className="mx-auto mt-1.5 max-w-md text-center text-[13px] leading-snug text-[#395145] sm:mt-3 sm:text-[15px] sm:leading-relaxed">
          {subtitle}
        </p>
      </header>
      {children}
    </div>
  );
}
