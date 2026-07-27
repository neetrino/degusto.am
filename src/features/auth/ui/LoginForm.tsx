"use client";

import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AppLink } from "@/components/ui/AppLink";
import { loginAction, type AuthActionState } from "@/features/auth/login-action";
import {
  authIconBubbleClassName,
  authInputClassName,
  authLabelClassName,
} from "@/features/auth/ui/AuthPageShell";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

const initialState: AuthActionState = {};

type LoginFormProps = {
  locale: Locale;
  dictionary: Dictionary["auth"];
};

export function LoginForm({ locale, dictionary }: LoginFormProps) {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const resetSucceeded = searchParams.get("reset") === "1";
  const action = loginAction.bind(null, locale);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <form action={formAction} className="space-y-4 sm:space-y-[18px]">
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}

      {resetSucceeded ? (
        <p
          role="status"
          className="rounded-2xl border border-green-200 bg-green-50 p-3 text-sm text-green-700"
        >
          {dictionary.resetPasswordSuccess}
        </p>
      ) : null}

      <div className="space-y-2.5">
        <label htmlFor="login-email" className={authLabelClassName}>
          {dictionary.email}
          <span className="ml-0.5 text-[#F66812]">*</span>
        </label>
        <div className="flex items-center gap-2.5">
          <span className={authIconBubbleClassName} aria-hidden>
            <Mail className="size-[15px]" strokeWidth={2} />
          </span>
          <input
            id="login-email"
            required
            name="email"
            type="email"
            autoComplete="email"
            placeholder={dictionary.emailPlaceholder}
            className={authInputClassName}
          />
        </div>
      </div>

      <div className="space-y-2.5">
        <label htmlFor="login-password" className={authLabelClassName}>
          {dictionary.password}
          <span className="ml-0.5 text-[#F66812]">*</span>
        </label>
        <div className="flex items-center gap-2.5">
          <span className={authIconBubbleClassName} aria-hidden>
            <LockKeyhole className="size-[15px]" strokeWidth={2} />
          </span>
          <div className="relative min-w-0 flex-1">
            <input
              id="login-password"
              required
              name="password"
              type={passwordVisible ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className={`${authInputClassName} pr-12`}
            />
            <button
              type="button"
              className="absolute top-1/2 right-3.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-[#375445] transition-colors hover:bg-[#f66812]/10 hover:text-[#1f3a22] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f66812]/30"
              aria-label={
                passwordVisible
                  ? dictionary.hidePassword
                  : dictionary.showPassword
              }
              aria-pressed={passwordVisible}
              onClick={() => setPasswordVisible((current) => !current)}
            >
              {passwordVisible ? (
                <EyeOff className="size-5" aria-hidden />
              ) : (
                <Eye className="size-5" aria-hidden />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex min-h-11 items-center justify-between gap-3 pt-1">
        <label className="flex shrink-0 items-center">
          <input
            type="checkbox"
            name="remember"
            value="1"
            className="size-[18px] shrink-0 rounded border-[#cfbc9f] text-[#f66812] accent-[#f66812] focus:ring-[#f66812]/25"
          />
          <span className="ml-2.5 shrink-0 text-sm leading-none whitespace-nowrap text-[#274531]">
            {dictionary.rememberMe}
          </span>
        </label>
        <AppLink
          href={`/${locale}/forgot-password`}
          prefetchPolicy="intent"
          className="shrink-0 text-sm font-semibold text-[#f66812] transition-opacity hover:underline active:opacity-80"
        >
          {dictionary.forgotPassword}
        </AppLink>
      </div>

      {state.error ? (
        <p
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-600"
        >
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-1 h-12 w-full rounded-2xl border border-[#1f3a22] bg-[#1f3a22] text-base font-semibold text-[#fffdf8] shadow-[0px_10px_20px_rgba(31,58,34,0.24)] transition-[background-color,transform,box-shadow] duration-200 hover:bg-[#19311c] hover:shadow-[0px_14px_24px_rgba(31,58,34,0.28)] active:scale-[0.99] disabled:scale-100 disabled:opacity-60"
      >
        {isPending ? dictionary.submittingLogin : dictionary.submitLogin}
      </button>

      <p className="py-0.5 text-center text-sm text-[#3d5848]/80">
        {dictionary.orDivider}
      </p>

      <p className="text-center text-sm text-[#274531]">
        {dictionary.noAccount}{" "}
        <AppLink
          href={`/${locale}/register`}
          prefetchPolicy="intent"
          className="font-semibold text-[#f66812] hover:underline"
        >
          {dictionary.registerLink}
        </AppLink>
      </p>
    </form>
  );
}
