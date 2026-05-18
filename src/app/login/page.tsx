'use client';

import { useState, FormEvent, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button, Input, Card } from '@shop/ui';
import Link from 'next/link';
import { useAuth } from '../../lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../lib/i18n-client';
import { resolveLoginApiError } from '../../lib/auth/client-api-error-messages';
import { motion } from 'framer-motion';
import type { IconType } from 'react-icons';
import { FaCarrot, FaFish, FaHamburger, FaPepperHot, FaPizzaSlice } from 'react-icons/fa';
import { Eye, EyeOff } from 'lucide-react';
import { logger } from "@/lib/utils/logger";

const loginSideAccentUrl = 'https://www.figma.com/api/mcp/asset/2e1ae4b8-0ffa-4da7-95de-6ed5e985904d';

const floatingFoodIcons: ReadonlyArray<{
  icon: IconType;
  className: string;
  size: number;
  duration: number;
  delay: number;
}> = [
  { icon: FaPizzaSlice, className: 'left-[7%] top-[20%]', size: 36, duration: 6.2, delay: 0.2 },
  { icon: FaHamburger, className: 'left-[12%] top-[50%]', size: 44, duration: 7.1, delay: 0.8 },
  { icon: FaFish, className: 'left-[9%] top-[78%]', size: 34, duration: 6.6, delay: 0.5 },
  { icon: FaCarrot, className: 'left-[30%] top-[14%]', size: 30, duration: 6.4, delay: 1.1 },
  { icon: FaPepperHot, className: 'left-[34%] top-[82%]', size: 28, duration: 5.9, delay: 1.3 },
  { icon: FaFish, className: 'left-[69%] top-[16%]', size: 34, duration: 6.5, delay: 0.1 },
  { icon: FaCarrot, className: 'left-[86%] top-[28%]', size: 32, duration: 6.8, delay: 0.6 },
  { icon: FaPizzaSlice, className: 'left-[90%] top-[52%]', size: 36, duration: 6.1, delay: 1.0 },
  { icon: FaHamburger, className: 'left-[83%] top-[73%]', size: 42, duration: 7.0, delay: 0.4 },
  { icon: FaPepperHot, className: 'left-[58%] top-[88%]', size: 28, duration: 5.7, delay: 1.5 },
];

function LoginPageContent() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

    // Validation
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
      const destination = isUserAdmin ? '/supersudo' : redirectTo;
      logger.debug('✅ [LOGIN PAGE] Login successful, redirecting to:', destination);
      router.push(destination);
    } catch (err: any) {
      console.error('❌ [LOGIN PAGE] Login error:', err);
      setError(resolveLoginApiError(err instanceof Error ? err.message : String(err), t));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect if already logged in (admins go to admin panel)
  useEffect(() => {
    if (isLoggedIn && !isLoading) {
      router.push(isAdmin ? '/supersudo' : redirectTo);
    }
  }, [isLoggedIn, isLoading, isAdmin, redirectTo, router]);

  return (
    <div className="relative z-20 -mt-[104px] min-h-dvh overflow-hidden bg-[#F66812] pt-[104px]">
      <svg
        aria-hidden="true"
        viewBox="0 0 1200 800"
        className="pointer-events-none absolute left-[-280px] top-[-380px] z-0 hidden h-[700px] w-[1080px] -rotate-[10deg] opacity-95 lg:block"
      >
        <circle
          cx="260"
          cy="100"
          r="620"
          stroke="#3E573D"
          strokeWidth="170"
          fill="none"
        />
      </svg>
      <img
        src={loginSideAccentUrl}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-[-190px] top-[-10px] z-0 hidden h-[1160px] w-[460px] -rotate-[8deg] object-contain opacity-100 lg:block"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1] hidden lg:block">
        {floatingFoodIcons.map((foodIcon) => {
          const Icon = foodIcon.icon;
          return (
            <motion.div
              key={`${foodIcon.className}-${foodIcon.size}`}
              className={`absolute ${foodIcon.className} text-[#1F2E1F]/52 drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]`}
              initial={{ opacity: 0.4, y: 0, rotate: -4, scale: 1 }}
              animate={{ opacity: [0.4, 0.58, 0.4], y: [0, -12, 0], rotate: [-4, 4, -4], scale: [1, 1.04, 1] }}
              transition={{
                duration: foodIcon.duration,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: foodIcon.delay,
              }}
            >
              <Icon size={foodIcon.size} />
            </motion.div>
          );
        })}
      </div>
      <div className="relative z-10 mx-auto max-w-lg px-4 py-12 sm:px-6 lg:translate-x-3 lg:px-8">
        <div className="relative">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-3 -left-10 -right-10 rounded-[120px] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.92)_0%,rgba(255,255,255,0.72)_42%,rgba(246,104,18,0.4)_72%,rgba(246,104,18,0)_100%)] blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-8 -left-14 -right-14 rounded-[140px] bg-[radial-gradient(ellipse_at_center,rgba(246,104,18,0.28)_0%,rgba(246,104,18,0.16)_45%,rgba(255,255,255,0)_80%)] blur-3xl"
          />
          <Card className="relative rounded-t-[70px] border border-transparent bg-[linear-gradient(160deg,#ffffff_0%,#fff4ea_34%,#ffe6d2_62%,#ffd6b5_100%)] px-8 pb-8 pt-24 shadow-[0_20px_45px_rgba(246,104,18,0.28)] backdrop-blur-sm">
        <h1 className="mb-2 text-center text-3xl font-bold text-[#1F2E1F]">{t('login.title')}</h1>
        <p className="mb-8 text-[#1F2E1F]">{t('login.subtitle')}</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-[#1F2E1F]">
              {t('login.form.emailOrPhone')}
            </label>
            <Input
              id="email"
              type="email"
              placeholder={t('login.form.emailOrPhonePlaceholder')}
              className="w-full border-gray-300 bg-white text-[#1F2E1F] placeholder:text-[#1F2E1F]/70 transition-colors hover:border-[#F66812] focus:border-[#F66812] focus:ring-[#F66812]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={isSubmitting || isLoading}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-[#1F2E1F]">
              {t('login.form.password')}
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('login.form.passwordPlaceholder')}
                className="w-full border-gray-300 bg-white pr-10 text-[#1F2E1F] placeholder:text-[#1F2E1F]/70 transition-colors hover:border-[#F66812] focus:border-[#F66812] focus:ring-[#F66812]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting || isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 hidden -translate-y-1/2 text-[#1F2E1F]/70 hover:text-[#1F2E1F] focus:outline-none lg:block"
                disabled={isSubmitting || isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-gray-300 text-[#F66812] focus:ring-[#F66812]"
                disabled={isSubmitting || isLoading}
              />
              <span className="ml-2 text-sm text-[#1F2E1F]">{t('login.form.rememberMe')}</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-[#F66812] hover:underline"
            >
              {t('login.form.forgotPassword')}
            </Link>
          </div>
          <Button 
            variant="primary" 
            className="w-full border border-[#1F3A22] bg-[#1F3A22] text-white hover:bg-[#18301C]"
            type="submit"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting || isLoading ? t('login.form.submitting') : t('login.form.submit')}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-[#1F2E1F]">
            {t('login.form.noAccount')}{' '}
            <Link href="/register" className="font-medium text-[#F66812] hover:underline">
              {t('login.form.signUp')}
            </Link>
          </p>
        </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6 lg:translate-x-3 lg:px-8">
        <Card className="rounded-t-[150px] border border-[#f5c7a8] bg-white px-8 pb-8 pt-24 shadow-[0_18px_45px_rgba(0,0,0,0.12)]">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </Card>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}

