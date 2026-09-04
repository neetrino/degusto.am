"use client";

import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";
import { useActionState, useState, type ReactNode } from "react";

import { AppLink } from "@/components/ui/AppLink";
import {
  resolveAuthErrorMessage,
  type AuthActionState,
} from "@/features/auth/auth-action-state";
import { registerAction } from "@/features/auth/register-action";
import {
  authInputClassName,
  authLabelClassName,
} from "@/features/auth/ui/auth-form-classes";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

const initialState: AuthActionState = {};

type RegisterFormProps = {
  locale: Locale;
  dictionary: Dictionary["auth"];
};

const authFieldInputClassName = `${authInputClassName} pl-11`;

export function RegisterForm({ locale, dictionary }: RegisterFormProps) {
  const action = registerAction.bind(null, locale);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const alertMessage = resolveAuthErrorMessage(state, dictionary);

  return (
    <form action={formAction} className="space-y-4 sm:space-y-[18px]">
      <input type="hidden" name="locale" value={locale} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <AuthTextField
          id="firstName"
          name="firstName"
          label={dictionary.firstName}
          required
          autoComplete="given-name"
          placeholder={dictionary.firstNamePlaceholder}
          icon={<UserRound className="size-[18px]" aria-hidden />}
        />
        <AuthTextField
          id="lastName"
          name="lastName"
          label={dictionary.lastName}
          required
          autoComplete="family-name"
          placeholder={dictionary.lastNamePlaceholder}
          icon={<UserRound className="size-[18px]" aria-hidden />}
        />
      </div>

      <AuthTextField
        id="email"
        name="email"
        type="email"
        label={dictionary.email}
        required
        autoComplete="email"
        placeholder={dictionary.emailPlaceholder}
        icon={<Mail className="size-[18px]" aria-hidden />}
      />

      <AuthTextField
        id="phone"
        name="phone"
        type="tel"
        label={dictionary.phone}
        required
        autoComplete="tel"
        placeholder={dictionary.phonePlaceholder}
        icon={<Phone className="size-[18px]" aria-hidden />}
      />

      <AuthPasswordField
        id="password"
        name="password"
        label={dictionary.password}
        required
        autoComplete="new-password"
        visible={passwordVisible}
        onToggleVisible={() => setPasswordVisible((v) => !v)}
        showLabel={dictionary.showPassword}
        hideLabel={dictionary.hidePassword}
        hint={dictionary.passwordHint}
      />

      <AuthPasswordField
        id="confirmPassword"
        name="confirmPassword"
        label={dictionary.confirmPassword}
        required
        autoComplete="new-password"
        visible={confirmVisible}
        onToggleVisible={() => setConfirmVisible((v) => !v)}
        showLabel={dictionary.showPassword}
        hideLabel={dictionary.hidePassword}
      />

      <div className="flex items-start gap-2.5 rounded-2xl bg-[#fff6ea] px-3 py-3">
        <input
          id="terms"
          name="terms"
          type="checkbox"
          required
          className="mt-0.5 size-[18px] shrink-0 rounded border-[#cfbc9f] text-[#f66812] accent-[#f66812] focus:ring-[#f66812]/25"
        />
        <label htmlFor="terms" className="text-sm leading-relaxed text-[#1F2E1F]">
          {dictionary.termsPrefix}{" "}
          <AppLink
            href={`/${locale}/legal/terms`}
            prefetchPolicy="intent"
            className="shrink-0 text-sm font-semibold text-[#f66812] transition-opacity hover:underline active:opacity-80"
          >
            {dictionary.termsOfService}
          </AppLink>{" "}
          {dictionary.termsAnd}{" "}
          <AppLink
            href={`/${locale}/legal/privacy`}
            prefetchPolicy="intent"
            className="shrink-0 text-sm font-semibold text-[#f66812] transition-opacity hover:underline active:opacity-80"
          >
            {dictionary.privacyPolicy}
          </AppLink>
        </label>
      </div>

      {alertMessage ? (
        <p
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-600"
        >
          {alertMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-1 h-12 w-full rounded-2xl border border-[#1f3a22] bg-[#1f3a22] text-base font-semibold text-[#fffdf8] shadow-[0px_10px_20px_rgba(31,58,34,0.24)] transition-[background-color,transform,box-shadow] duration-200 hover:bg-[#19311c] hover:shadow-[0px_14px_24px_rgba(31,58,34,0.28)] active:scale-[0.99] disabled:scale-100 disabled:opacity-60"
      >
        {isPending
          ? dictionary.submittingRegister
          : dictionary.submitRegister}
      </button>

      <p className="text-center text-sm text-[#274531]">
        {dictionary.hasAccount}{" "}
        <AppLink
          href={`/${locale}/login`}
          prefetchPolicy="intent"
          className="font-semibold text-[#f66812] hover:underline"
        >
          {dictionary.signInLink}
        </AppLink>
      </p>
    </form>
  );
}

type AuthTextFieldProps = {
  id: string;
  name: string;
  label: string;
  required?: boolean;
  type?: "text" | "email" | "tel";
  autoComplete: string;
  placeholder: string;
  icon: ReactNode;
};

function AuthTextField({
  id,
  name,
  label,
  required = false,
  type = "text",
  autoComplete,
  placeholder,
  icon,
}: AuthTextFieldProps) {
  return (
    <div className="space-y-2.5">
      <label htmlFor={id} className={authLabelClassName}>
        {label}
        {required ? <span className="ml-0.5 text-[#F66812]">*</span> : null}
      </label>
      <div className="relative">
        <span
          className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[#3b5845]/75"
          aria-hidden
        >
          {icon}
        </span>
        <input
          id={id}
          name={name}
          type={type}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={authFieldInputClassName}
        />
      </div>
    </div>
  );
}

type AuthPasswordFieldProps = {
  id: string;
  name: string;
  label: string;
  required?: boolean;
  autoComplete: string;
  visible: boolean;
  onToggleVisible: () => void;
  showLabel: string;
  hideLabel: string;
  hint?: string;
};

function AuthPasswordField({
  id,
  name,
  label,
  required = false,
  autoComplete,
  visible,
  onToggleVisible,
  showLabel,
  hideLabel,
  hint,
}: AuthPasswordFieldProps) {
  return (
    <div className="space-y-2.5">
      <label htmlFor={id} className={authLabelClassName}>
        {label}
        {required ? <span className="ml-0.5 text-[#F66812]">*</span> : null}
      </label>
      <div className="relative">
        <span
          className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[#3b5845]/75"
          aria-hidden
        >
          <LockKeyhole className="size-[18px]" />
        </span>
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required={required}
          autoComplete={autoComplete}
          placeholder="••••••••"
          className={`${authFieldInputClassName} pr-12`}
        />
        <button
          type="button"
          className="absolute top-1/2 right-3.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-[#375445] transition-colors hover:bg-[#f66812]/10 hover:text-[#1f3a22] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f66812]/30"
          aria-label={visible ? hideLabel : showLabel}
          aria-pressed={visible}
          onClick={onToggleVisible}
        >
          {visible ? (
            <EyeOff className="size-5" aria-hidden />
          ) : (
            <Eye className="size-5" aria-hidden />
          )}
        </button>
      </div>
      {hint ? (
        <p className="text-xs leading-relaxed text-[#5a7263]">{hint}</p>
      ) : null}
    </div>
  );
}
