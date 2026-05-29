'use client';

import type { InputHTMLAttributes, ReactNode } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { Input } from '@shop/ui';
import { Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from 'lucide-react';
import {
  AUTH_FORM_CHECKBOX_CLASS,
  AUTH_FORM_CHECKBOX_LABEL_CLASS,
  AUTH_FORM_ERROR_CLASS,
  AUTH_FORM_FIELD_CLASS,
  AUTH_FORM_FOOTER_CLASS,
  AUTH_FORM_FOOTER_LINK_CLASS,
  AUTH_FORM_FOOTER_TEXT_CLASS,
  AUTH_FORM_CLASS,
  AUTH_FORM_HEADER_CLASS,
  AUTH_FORM_HINT_CLASS,
  AUTH_FORM_INPUT_CLASS,
  AUTH_FORM_INPUT_PASSWORD_CLASS,
  AUTH_FORM_LABEL_CLASS,
  AUTH_FORM_LINK_CLASS,
  AUTH_FORM_NAME_GRID_CLASS,
  AUTH_FORM_OPTIONS_ROW_CLASS,
  AUTH_FORM_PASSWORD_TOGGLE_CLASS,
  AUTH_FORM_REQUIRED_MARK_CLASS,
  AUTH_FORM_SUBMIT_CLASS,
  AUTH_FORM_SUBTITLE_CLASS,
  AUTH_FORM_TERMS_ROW_CLASS,
  AUTH_FORM_TITLE_CLASS,
  AUTH_FORM_WRAPPER_CLASS,
} from '@/constants/auth-page-layout';

export function AuthFormWrapper({ children }: { children: ReactNode }) {
  return <div className={AUTH_FORM_WRAPPER_CLASS}>{children}</div>;
}

type AuthFormHeaderProps = {
  title: string;
  subtitle: string;
  icon?: ReactNode;
};

export function AuthFormHeader({ title, subtitle, icon }: AuthFormHeaderProps) {
  return (
    <header className={AUTH_FORM_HEADER_CLASS}>
      {icon ? (
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-[#f4dfbf] p-1 shadow-[0_10px_22px_rgba(49,27,0,0.2)]">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1f3a22] text-[#fff2d8] shadow-[inset_0_0_0_1px_rgba(255,235,200,0.28)]">
              {icon}
            </div>
          </div>
        </div>
      ) : null}
      <h1 className={AUTH_FORM_TITLE_CLASS}>{title}</h1>
      <p className={AUTH_FORM_SUBTITLE_CLASS}>{subtitle}</p>
    </header>
  );
}

type AuthFormErrorProps = {
  message: string;
};

export function AuthFormError({ message }: AuthFormErrorProps) {
  return (
    <div className={AUTH_FORM_ERROR_CLASS} role="alert">
      <p className="text-sm leading-relaxed text-red-600">{message}</p>
    </div>
  );
}

type AuthFormFieldProps = {
  id: string;
  label: string;
  required?: boolean;
  prefixIcon?: ReactNode;
  children: ReactNode;
};

export function AuthFormField({ id, label, required, prefixIcon, children }: AuthFormFieldProps) {
  return (
    <div className={AUTH_FORM_FIELD_CLASS}>
      <label htmlFor={id} className={AUTH_FORM_LABEL_CLASS}>
        {label}
        {required ? <span className={AUTH_FORM_REQUIRED_MARK_CLASS}>*</span> : null}
      </label>
      {prefixIcon ? (
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f7e8d3] text-[#cf8a2c] shadow-[0_4px_10px_rgba(161,95,14,0.14)]">
            {prefixIcon}
          </span>
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

type AuthFormTextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  id: string;
  leadingIcon?: ReactNode | null;
};

export function AuthFormTextInput(props: AuthFormTextInputProps) {
  const { leadingIcon, ...inputProps } = props;
  const inputType = inputProps.type ?? 'text';
  const icon =
    leadingIcon !== undefined
      ? leadingIcon
      : inputType === 'email'
        ? (
      <Mail className="h-[18px] w-[18px]" />
          )
        : inputType === 'tel'
          ? (
      <Phone className="h-[18px] w-[18px]" />
            )
          : (
      <UserRound className="h-[18px] w-[18px]" />
            );

  if (!icon) {
    return <Input {...inputProps} className={AUTH_FORM_INPUT_CLASS} />;
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#3b5845]/75">
        {icon}
      </span>
      <Input {...inputProps} className={`${AUTH_FORM_INPUT_CLASS} pl-11`} />
    </div>
  );
}

type AuthFormPasswordInputProps = Omit<AuthFormTextInputProps, 'type'> & {
  leadingIcon?: ReactNode | null;
};

export function AuthFormPasswordInput({
  disabled,
  leadingIcon,
  ...props
}: AuthFormPasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      {leadingIcon !== null ? (
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#3b5845]/75">
          {leadingIcon ?? <LockKeyhole className="h-[18px] w-[18px]" />}
        </span>
      ) : null}
      <Input
        {...props}
        type={visible ? 'text' : 'password'}
        disabled={disabled}
        className={
          leadingIcon === null
            ? AUTH_FORM_INPUT_PASSWORD_CLASS
            : `${AUTH_FORM_INPUT_PASSWORD_CLASS} pl-11`
        }
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className={AUTH_FORM_PASSWORD_TOGGLE_CLASS}
        disabled={disabled}
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  );
}

type AuthFormOptionsRowProps = {
  rememberLabel: string;
  rememberChecked: boolean;
  onRememberChange: (checked: boolean) => void;
  forgotPasswordHref: string;
  forgotPasswordLabel: string;
  disabled?: boolean;
};

export function AuthFormOptionsRow({
  rememberLabel,
  rememberChecked,
  onRememberChange,
  forgotPasswordHref,
  forgotPasswordLabel,
  disabled,
}: AuthFormOptionsRowProps) {
  return (
    <div className={AUTH_FORM_OPTIONS_ROW_CLASS}>
      <label className="flex min-w-0 items-center">
        <input
          type="checkbox"
          checked={rememberChecked}
          onChange={(e) => onRememberChange(e.target.checked)}
          className={AUTH_FORM_CHECKBOX_CLASS}
          disabled={disabled}
        />
        <span className={AUTH_FORM_CHECKBOX_LABEL_CLASS}>{rememberLabel}</span>
      </label>
      <Link href={forgotPasswordHref} className={AUTH_FORM_LINK_CLASS}>
        {forgotPasswordLabel}
      </Link>
    </div>
  );
}

type AuthFormSubmitButtonProps = {
  children: ReactNode;
  disabled?: boolean;
};

export function AuthFormSubmitButton({ children, disabled }: AuthFormSubmitButtonProps) {
  return (
    <button type="submit" disabled={disabled} className={AUTH_FORM_SUBMIT_CLASS}>
      {children}
    </button>
  );
}

type AuthFormFooterProps = {
  text: string;
  linkHref: string;
  linkLabel: string;
};

export function AuthFormFooter({ text, linkHref, linkLabel }: AuthFormFooterProps) {
  return (
    <footer className={AUTH_FORM_FOOTER_CLASS}>
      <p className={AUTH_FORM_FOOTER_TEXT_CLASS}>
        {text}{' '}
        <Link href={linkHref} className={AUTH_FORM_FOOTER_LINK_CLASS}>
          {linkLabel}
        </Link>
      </p>
    </footer>
  );
}

export function AuthForm({ children, onSubmit }: {
  children: ReactNode;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit} className={AUTH_FORM_CLASS}>
      {children}
    </form>
  );
}

export const authFormLayout = {
  nameGrid: AUTH_FORM_NAME_GRID_CLASS,
  hint: AUTH_FORM_HINT_CLASS,
  termsRow: AUTH_FORM_TERMS_ROW_CLASS,
  checkbox: AUTH_FORM_CHECKBOX_CLASS,
  link: AUTH_FORM_LINK_CLASS,
};
