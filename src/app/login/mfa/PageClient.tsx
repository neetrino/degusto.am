'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTranslation } from '@/lib/i18n-client';
import { resolvePostLoginPath } from '@/lib/auth/resolve-post-login-path';
import { AuthPageShell } from '@/components/auth/AuthPageShell';
import {
  AuthForm,
  AuthFormError,
  AuthFormField,
  AuthFormHeader,
  AuthFormSubmitButton,
  AuthFormTextInput,
  AuthFormWrapper,
} from '@/components/auth/auth-form-ui';

const MFA_TOKEN_STORAGE_KEY = 'degusto_mfa_challenge_token';

function MfaLoginContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const { verifyMfaLogin, isLoggedIn, isAdmin, isLoading } = useAuth();
  const [code, setCode] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(MFA_TOKEN_STORAGE_KEY);
    if (!stored) {
      router.replace('/login');
      return;
    }
    setMfaToken(stored);
  }, [router]);

  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      router.replace(resolvePostLoginPath({ isAdmin, redirectTo: '/supersudo' }));
    }
  }, [isAdmin, isLoading, isLoggedIn, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const user = await verifyMfaLogin(mfaToken, code);
      sessionStorage.removeItem(MFA_TOKEN_STORAGE_KEY);
      const destination = resolvePostLoginPath({
        isAdmin: Array.isArray(user.roles) && user.roles.includes('admin'),
        redirectTo: '/supersudo',
      });
      router.push(destination);
    } catch {
      setError(t('login.mfa.invalidCode'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageShell contentMaxWidthClass="max-w-[520px]">
      <AuthFormWrapper>
        <AuthFormHeader
          title={t('login.mfa.title')}
          subtitle={t('login.mfa.subtitle')}
          icon={<ShieldCheck className="h-8 w-8" aria-hidden="true" />}
        />
        {error ? <AuthFormError message={error} /> : null}
        <AuthForm onSubmit={handleSubmit}>
          <AuthFormField
            id="mfaCode"
            label={t('login.mfa.codeLabel')}
            required
            prefixIcon={<ShieldCheck className="h-[15px] w-[15px]" aria-hidden="true" />}
          >
            <AuthFormTextInput
              id="mfaCode"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              disabled={isSubmitting || !mfaToken}
              leadingIcon={null}
              required
            />
          </AuthFormField>
          <AuthFormSubmitButton disabled={isSubmitting || code.length !== 6}>
            {isSubmitting ? t('login.mfa.submitting') : t('login.mfa.submit')}
          </AuthFormSubmitButton>
        </AuthForm>
      </AuthFormWrapper>
    </AuthPageShell>
  );
}

export default function MfaLoginPage() {
  return (
    <Suspense fallback={null}>
      <MfaLoginContent />
    </Suspense>
  );
}
