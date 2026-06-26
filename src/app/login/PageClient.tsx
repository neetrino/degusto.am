'use client';

import { useState, FormEvent, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChefHat, LockKeyhole, Mail } from 'lucide-react';
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
      const loginResult = await login(normalizedEmail, password);

      if (loginResult.kind === 'mfa_required') {
        router.push('/login/mfa');
        return;
      }

      const loggedInUser = loginResult.user;
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
    <AuthPageShell contentMaxWidthClass="max-w-[520px]">
      <AuthFormWrapper>
        <AuthFormHeader
          title={t('login.title')}
          subtitle={t('login.subtitle')}
          icon={<ChefHat className="h-8 w-8" aria-hidden="true" />}
        />
        {error ? <AuthFormError message={error} /> : null}
        <AuthForm onSubmit={handleSubmit}>
          <AuthFormField
            id="email"
            label={t('login.form.emailOrPhone')}
            required
            prefixIcon={<Mail className="h-[15px] w-[15px]" aria-hidden="true" />}
          >
            <AuthFormTextInput
              id="email"
              type="email"
              placeholder={t('login.form.emailOrPhonePlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={fieldsDisabled}
              leadingIcon={null}
              required
            />
          </AuthFormField>
          <AuthFormField
            id="password"
            label={t('login.form.password')}
            required
            prefixIcon={<LockKeyhole className="h-[15px] w-[15px]" aria-hidden="true" />}
          >
            <AuthFormPasswordInput
              id="password"
              placeholder={t('login.form.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={fieldsDisabled}
              leadingIcon={null}
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
          <p className="py-0.5 text-center text-sm text-[#3d5848]/80">{t('login.form.or')}</p>
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
    <AuthPageShell contentMaxWidthClass="max-w-[520px]">
      <AuthFormWrapper>
        <div className="animate-pulse">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-[#f2dec7]" />
          <div className="mx-auto mb-3 h-8 w-3/4 rounded bg-[#f2dec7]" />
          <div className="mx-auto mb-8 h-4 w-1/2 rounded bg-[#f2dec7]" />
          <div className="space-y-5">
            <div className="h-12 rounded-2xl bg-[#f2dec7]" />
            <div className="h-12 rounded-2xl bg-[#f2dec7]" />
            <div className="h-12 rounded-2xl bg-[#f2dec7]" />
          </div>
        </div>
      </AuthFormWrapper>
    </AuthPageShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
