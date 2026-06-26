'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mail } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useTranslation } from '@/lib/i18n-client';
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
} from '@/components/auth/auth-form-ui';

function ForgotPasswordContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = searchParams?.get('redirect') || '/login';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const response = await apiClient.post<{ message: string }>(
        '/api/v1/auth/forgot-password',
        { email: email.trim().toLowerCase() },
        { skipAuth: true },
      );
      setSuccess(response.message || t('login.passwordReset.requestSuccess'));
    } catch {
      setError(t('login.passwordReset.requestFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageShell contentMaxWidthClass="max-w-[520px]">
      <AuthFormWrapper>
        <AuthFormHeader
          title={t('login.passwordReset.forgotTitle')}
          subtitle={t('login.passwordReset.forgotSubtitle')}
          icon={<Mail className="h-8 w-8" aria-hidden="true" />}
        />
        {error ? <AuthFormError message={error} /> : null}
        {success ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {success}
          </p>
        ) : null}
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
              disabled={isSubmitting}
              leadingIcon={null}
              required
            />
          </AuthFormField>
          <AuthFormSubmitButton disabled={isSubmitting}>
            {isSubmitting
              ? t('login.passwordReset.requestSubmitting')
              : t('login.passwordReset.requestSubmit')}
          </AuthFormSubmitButton>
        </AuthForm>
        <AuthFormFooter
          text={t('login.passwordReset.backToLogin')}
          linkHref={redirectTo}
          linkLabel={t('login.form.submit')}
        />
      </AuthFormWrapper>
    </AuthPageShell>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
