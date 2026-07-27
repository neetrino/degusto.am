import { ChefHat } from "lucide-react";
import type { ReactNode } from "react";

type AuthPageShellProps = {
  children: ReactNode;
};

/**
 * Full-bleed Degusto auth canvas — cream on mobile; desktop hero is painted
 * on the storefront shell (see globals) so it reaches the footer radius.
 */
export function AuthPageShell({ children }: AuthPageShellProps) {
  return (
    <div
      data-auth-page
      className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] -mt-[7.5rem] flex w-screen flex-1 flex-col"
    >
      <div className="relative z-10 flex min-h-[calc(100dvh-7.5rem)] flex-1 flex-col overflow-hidden bg-[#FBF6EA] pt-[7.5rem] lg:min-h-0 lg:bg-transparent">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-0 h-48 overflow-hidden lg:hidden"
        >
          <div className="absolute -top-16 -left-10 size-44 rounded-full border-[18px] border-[#1f3a22]/25" />
          <div className="absolute -top-8 left-24 size-36 rounded-full border-[14px] border-[#1f3a22]/20" />
          <div className="absolute top-10 -right-12 size-40 rounded-full border-[16px] border-[#1f3a22]/22" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#F66812] via-[#F66812]/88 to-[#FBF6EA]" />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-[520px] flex-1 flex-col px-4 pt-7 pb-10 sm:px-6 lg:max-w-[34rem] lg:justify-center lg:px-8 lg:py-12">
          {children}
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

/** Cream gradient auth card with chef-hat badge. */
export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="relative overflow-visible rounded-[30px] border border-[#FFE5CF] bg-[linear-gradient(168deg,#fffef9_0%,#fff7eb_44%,#ffeed9_100%)] p-6 shadow-[0_24px_60px_rgba(50,24,0,0.22)] sm:p-8 lg:rounded-[34px] lg:px-10 lg:pt-11 lg:pb-10">
      <header className="mb-7 text-center sm:mb-8">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-[#f4dfbf] p-1 shadow-[0_10px_22px_rgba(49,27,0,0.2)]">
            <div className="flex size-16 items-center justify-center rounded-full bg-[#1f3a22] text-[#fff2d8] shadow-[inset_0_0_0_1px_rgba(255,235,200,0.28)]">
              <ChefHat className="size-8" aria-hidden />
            </div>
          </div>
        </div>
        <h1 className="text-center text-[30px] leading-[1.15] font-bold tracking-tight text-[#16331f] sm:text-[32px]">
          {title}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-center text-sm leading-relaxed text-[#395145] sm:text-[15px]">
          {subtitle}
        </p>
      </header>
      {children}
    </div>
  );
}

export const authInputClassName =
  "h-12 w-full rounded-2xl border border-[#ead7bf] bg-[#fffaf2] px-4 text-[15px] leading-6 text-[#183322] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.05)] placeholder:text-[#7f8f84] outline-none transition-[border-color,box-shadow,background-color] duration-200 hover:border-[#f66812]/45 focus:border-[#f66812] focus:bg-white focus:ring-4 focus:ring-[#f66812]/15 disabled:cursor-not-allowed disabled:opacity-60";

export const authLabelClassName =
  "block text-sm font-semibold text-[#1d3b27]";

export const authIconBubbleClassName =
  "flex size-9 shrink-0 items-center justify-center rounded-full bg-[#f7e8d3] text-[#cf8a2c] shadow-[0_4px_10px_rgba(161,95,14,0.14)]";
