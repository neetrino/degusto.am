'use client';

import { useState, FormEvent, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@shop/ui';
import { useAuth } from '../../lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../lib/i18n-client';
import { resolveLoginApiError } from '../../lib/auth/client-api-error-messages';
import { resolvePostLoginPath } from '../../lib/auth/resolve-post-login-path';
import { logger } from '@/lib/utils/logger';
import { AuthPageShell } from '@/components/auth/AuthPageShell';
import {
  AuthForm,
  AuthFormError,
  AuthFormField,
  AuthFormFooter,
  AuthFormHeader,
  AuthFormOptionsRow,
  AuthFormPasswordInput,
  AuthFormSubmitButton,
  AuthFormTextInput,
  AuthFormWrapper,
} from '@/components/auth/auth-form-ui';
import { AUTH_PAGE_CARD_CLASS } from '@/constants/auth-page-layout';

function LoginPageContent() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isLoading, isLoggedIn, isAdmin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirect') || '/';

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    logger.debug('🔐 [LOGIN PAGE] Form submitted');

    if (!email.trim()) {
      setError(t('login.errors.identifierRequired'));
      setIsSubmitting(false);
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalizedEmail)) {
      setError(t('login.errors.emailInvalid'));
      setIsSubmitting(false);
      return;
    }

    if (!password) {
      setError(t('login.errors.passwordRequired'));
      setIsSubmitting(false);
      return;
    }

    try {
      logger.debug('📤 [LOGIN PAGE] Calling login function...');
      const loggedInUser = await login(normalizedEmail, password);
      const isUserAdmin =
        Array.isArray(loggedInUser.roles) && loggedInUser.roles.includes('admin');
      const destination = resolvePostLoginPath({
        isAdmin: isUserAdmin,
        redirectTo,
      });
      logger.debug('✅ [LOGIN PAGE] Login successful, redirecting to:', destination);
      router.push(destination);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('❌ [LOGIN PAGE] Login error:', message);
      setError(resolveLoginApiError(message, t));
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && !isLoading) {
      router.push(resolvePostLoginPath({ isAdmin, redirectTo }));
    }
  }, [isLoggedIn, isLoading, isAdmin, redirectTo, router]);

  const fieldsDisabled = isSubmitting || isLoading;

  return (
    <AuthPageShell>
      <AuthFormWrapper>
        <AuthFormHeader title={t('login.title')} subtitle={t('login.subtitle')} />
        {error ? <AuthFormError message={error} /> : null}
        <AuthForm onSubmit={handleSubmit}>
          <AuthFormField id="email" label={t('login.form.emailOrPhone')} required>
            <AuthFormTextInput
              id="email"
              type="email"
              placeholder={t('login.form.emailOrPhonePlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={fieldsDisabled}
              required
            />
          </AuthFormField>
          <AuthFormField id="password" label={t('login.form.password')} required>
            <AuthFormPasswordInput
              id="password"
              placeholder={t('login.form.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={fieldsDisabled}
              required
            />
          </AuthFormField>
          <AuthFormOptionsRow
            rememberLabel={t('login.form.rememberMe')}
            rememberChecked={rememberMe}
            onRememberChange={setRememberMe}
            forgotPasswordHref="/forgot-password"
            forgotPasswordLabel={t('login.form.forgotPassword')}
            disabled={fieldsDisabled}
          />
          <AuthFormSubmitButton disabled={fieldsDisabled}>
            {fieldsDisabled ? t('login.form.submitting') : t('login.form.submit')}
          </AuthFormSubmitButton>
        </AuthForm>
        <AuthFormFooter
          text={t('login.form.noAccount')}
          linkHref="/register"
          linkLabel={t('login.form.signUp')}
        />
      </AuthFormWrapper>
    </AuthPageShell>
  );
}

function LoginPageFallback() {
  return (
    <div className="min-h-dvh bg-white px-4 py-6 lg:bg-[#F66812]">
      <div className="mx-auto max-w-lg">
        <Card className={AUTH_PAGE_CARD_CLASS}>
          <div className="animate-pulse">
            <div className="mx-auto mb-4 h-8 w-3/4 rounded bg-gray-200" />
            <div className="mx-auto mb-8 h-4 w-1/2 rounded bg-gray-200" />
            <div className="space-y-5">
              <div className="h-12 rounded-[30px] bg-gray-200" />
              <div className="h-12 rounded-[30px] bg-gray-200" />
              <div className="h-12 rounded-[30px] bg-gray-200" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
