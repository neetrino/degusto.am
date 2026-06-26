'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LockKeyhole } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTranslation } from '@/lib/i18n-client';
import { AuthPageShell } from '@/components/auth/AuthPageShell';
import {
  AuthForm,
  AuthFormError,
  AuthFormField,
  AuthFormHeader,
  AuthFormPasswordInput,
  AuthFormSubmitButton,
  AuthFormWrapper,
} from '@/components/auth/auth-form-ui';

function ResetPasswordContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const legacyToken = searchParams?.get('token') ?? '';
  const urlError = searchParams?.get('error');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const { completePasswordReset } = useAuth();

  useEffect(() => {
    if (urlError === 'invalid') {
      setError(t('login.passwordReset.invalidToken'));
      setIsReady(true);
      return;
    }

    if (legacyToken) {
      router.replace(
        `/api/v1/auth/reset-password/verify?token=${encodeURIComponent(legacyToken)}`,
      );
      return;
    }

    setIsReady(true);
  }, [legacyToken, router, t, urlError]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(t('login.passwordReset.passwordMinLength'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('login.passwordReset.passwordsMismatch'));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await completePasswordReset(password);
      if (result.kind === 'mfa_required') {
        router.push('/login/mfa');
        return;
      }
      router.push('/');
    } catch {
      setError(t('login.passwordReset.resetFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isReady) {
    return null;
  }

  return (
    <AuthPageShell contentMaxWidthClass="max-w-[520px]">
      <AuthFormWrapper>
        <AuthFormHeader
          title={t('login.passwordReset.resetTitle')}
          subtitle={t('login.passwordReset.resetSubtitle')}
          icon={<LockKeyhole className="h-8 w-8" aria-hidden="true" />}
        />
        {error ? <AuthFormError message={error} /> : null}
        <AuthForm onSubmit={handleSubmit}>
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
              disabled={isSubmitting || Boolean(urlError)}
              leadingIcon={null}
              required
            />
          </AuthFormField>
          <AuthFormField
            id="confirmPassword"
            label={t('login.passwordReset.confirmPassword')}
            required
            prefixIcon={<LockKeyhole className="h-[15px] w-[15px]" aria-hidden="true" />}
          >
            <AuthFormPasswordInput
              id="confirmPassword"
              placeholder={t('login.form.passwordPlaceholder')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting || Boolean(urlError)}
              leadingIcon={null}
              required
            />
          </AuthFormField>
          <AuthFormSubmitButton disabled={isSubmitting || Boolean(urlError)}>
            {isSubmitting
              ? t('login.passwordReset.resetSubmitting')
              : t('login.passwordReset.resetSubmit')}
          </AuthFormSubmitButton>
        </AuthForm>
      </AuthFormWrapper>
    </AuthPageShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
