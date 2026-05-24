'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth/AuthContext';
import { useTranslation } from '../../lib/i18n-client';
import { resolveRegisterApiError } from '../../lib/auth/client-api-error-messages';
import { logger } from '@/lib/utils/logger';
import { AuthPageShell } from '@/components/auth/AuthPageShell';
import {
  AuthForm,
  AuthFormError,
  AuthFormField,
  AuthFormFooter,
  AuthFormHeader,
  AuthFormPasswordInput,
  AuthFormSubmitButton,
  AuthFormTextInput,
  AuthFormWrapper,
  authFormLayout,
} from '@/components/auth/auth-form-ui';

export default function RegisterPage() {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, isLoading } = useAuth();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    logger.debug('🔐 [REGISTER PAGE] Form submitted');

    if (!acceptTerms) {
      setError(t('register.errors.acceptTerms'));
      setIsSubmitting(false);
      return;
    }

    if (!email.trim() && !phone.trim()) {
      setError(t('register.errors.emailOrPhoneRequired'));
      setIsSubmitting(false);
      return;
    }

    if (!password) {
      setError(t('register.errors.passwordRequired'));
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setError(t('register.errors.passwordMinLength'));
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setError(t('register.errors.passwordsDoNotMatch'));
      setIsSubmitting(false);
      return;
    }

    try {
      await register({
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        password,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });

      setTimeout(() => {
        if (window.location.pathname === '/register') {
          window.location.href = '/';
        }
      }, 1000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('❌ [REGISTER PAGE] Registration error:', message);
      setError(resolveRegisterApiError(message, t));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldsDisabled = isSubmitting || isLoading;
  const termsError = !acceptTerms && error === t('register.errors.acceptTerms');

  return (
    <AuthPageShell>
      <AuthFormWrapper>
        <AuthFormHeader title={t('register.title')} subtitle={t('register.subtitle')} />
        {error ? <AuthFormError message={error} /> : null}
        <AuthForm onSubmit={handleSubmit}>
          <div className={authFormLayout.nameGrid}>
            <AuthFormField id="firstName" label={t('register.form.firstName')} required>
              <AuthFormTextInput
                id="firstName"
                type="text"
                placeholder={t('register.placeholders.firstName')}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={fieldsDisabled}
                required
              />
            </AuthFormField>
            <AuthFormField id="lastName" label={t('register.form.lastName')} required>
              <AuthFormTextInput
                id="lastName"
                type="text"
                placeholder={t('register.placeholders.lastName')}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={fieldsDisabled}
                required
              />
            </AuthFormField>
          </div>
          <AuthFormField id="email" label={t('register.form.email')} required>
            <AuthFormTextInput
              id="email"
              type="email"
              placeholder={t('register.placeholders.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={fieldsDisabled}
              required
            />
          </AuthFormField>
          <AuthFormField id="phone" label={t('register.form.phone')}>
            <AuthFormTextInput
              id="phone"
              type="tel"
              placeholder={t('register.placeholders.phone')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={fieldsDisabled}
            />
          </AuthFormField>
          <AuthFormField id="password" label={t('register.form.password')} required>
            <AuthFormPasswordInput
              id="password"
              placeholder={t('register.placeholders.password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={fieldsDisabled}
              required
            />
            <p className={authFormLayout.hint}>{t('register.passwordHint')}</p>
          </AuthFormField>
          <AuthFormField id="confirmPassword" label={t('register.form.confirmPassword')} required>
            <AuthFormPasswordInput
              id="confirmPassword"
              placeholder={t('register.placeholders.confirmPassword')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={fieldsDisabled}
              required
            />
          </AuthFormField>
          <div className={authFormLayout.termsRow}>
            <input
              type="checkbox"
              id="terms"
              checked={acceptTerms}
              onChange={(e) => {
                setAcceptTerms(e.target.checked);
                if (e.target.checked && error === t('register.errors.acceptTerms')) {
                  setError(null);
                }
              }}
              className={`mt-0.5 ${authFormLayout.checkbox}`}
              disabled={fieldsDisabled}
              required
            />
            <label htmlFor="terms" className="text-sm leading-relaxed text-[#1F2E1F]">
              {t('register.form.acceptTerms')}{' '}
              <Link href="/terms" className={authFormLayout.link}>
                {t('register.form.termsOfService')}
              </Link>{' '}
              {t('register.form.and')}{' '}
              <Link href="/privacy" className={authFormLayout.link}>
                {t('register.form.privacyPolicy')}
              </Link>
            </label>
          </div>
          {termsError ? (
            <p className="-mt-2 text-xs text-red-600">{t('register.errors.mustAcceptTerms')}</p>
          ) : null}
          <AuthFormSubmitButton disabled={fieldsDisabled}>
            {fieldsDisabled
              ? t('register.form.creatingAccount')
              : t('register.form.createAccount')}
          </AuthFormSubmitButton>
        </AuthForm>
        <AuthFormFooter
          text={t('register.form.alreadyHaveAccount')}
          linkHref="/login"
          linkLabel={t('register.form.signIn')}
        />
      </AuthFormWrapper>
    </AuthPageShell>
  );
}
