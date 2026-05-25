'use client';

import type { InputHTMLAttributes, ReactNode } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { Input } from '@shop/ui';
import { Eye, EyeOff } from 'lucide-react';
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
};

export function AuthFormHeader({ title, subtitle }: AuthFormHeaderProps) {
  return (
    <header className={AUTH_FORM_HEADER_CLASS}>
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
  children: ReactNode;
};

export function AuthFormField({ id, label, required, children }: AuthFormFieldProps) {
  return (
    <div className={AUTH_FORM_FIELD_CLASS}>
      <label htmlFor={id} className={AUTH_FORM_LABEL_CLASS}>
        {label}
        {required ? <span className={AUTH_FORM_REQUIRED_MARK_CLASS}>*</span> : null}
      </label>
      {children}
    </div>
  );
}

type AuthFormTextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  id: string;
};

export function AuthFormTextInput(props: AuthFormTextInputProps) {
  return <Input {...props} className={AUTH_FORM_INPUT_CLASS} />;
}

type AuthFormPasswordInputProps = Omit<AuthFormTextInputProps, 'type'>;

export function AuthFormPasswordInput({
  disabled,
  ...props
}: AuthFormPasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? 'text' : 'password'}
        disabled={disabled}
        className={AUTH_FORM_INPUT_PASSWORD_CLASS}
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
