'use client';

import { useState, FormEvent } from 'react';
import { Button, Input, Card } from '@shop/ui';
import Link from 'next/link';
import { useAuth } from '../../lib/auth/AuthContext';
import { useTranslation } from '../../lib/i18n-client';
import { resolveRegisterApiError } from '../../lib/auth/client-api-error-messages';
import { motion } from 'framer-motion';
import type { IconType } from 'react-icons';
import { FaCarrot, FaFish, FaHamburger, FaPepperHot, FaPizzaSlice } from 'react-icons/fa';
import { Eye, EyeOff } from 'lucide-react';
import { logger } from "@/lib/utils/logger";

const registerSideAccentUrl = 'https://www.figma.com/api/mcp/asset/2e1ae4b8-0ffa-4da7-95de-6ed5e985904d';

const floatingFoodIcons: ReadonlyArray<{
  icon: IconType;
  className: string;
  size: number;
  duration: number;
  delay: number;
}> = [
  { icon: FaPizzaSlice, className: 'left-[8%] top-[20%]', size: 34, duration: 6.2, delay: 0.2 },
  { icon: FaHamburger, className: 'left-[12%] top-[52%]', size: 40, duration: 7.1, delay: 0.8 },
  { icon: FaFish, className: 'left-[10%] top-[80%]', size: 32, duration: 6.6, delay: 0.5 },
  { icon: FaCarrot, className: 'left-[30%] top-[14%]', size: 28, duration: 6.4, delay: 1.1 },
  { icon: FaPepperHot, className: 'left-[35%] top-[86%]', size: 26, duration: 5.9, delay: 1.3 },
  { icon: FaFish, className: 'left-[70%] top-[16%]', size: 32, duration: 6.5, delay: 0.1 },
  { icon: FaCarrot, className: 'left-[86%] top-[30%]', size: 30, duration: 6.8, delay: 0.6 },
  { icon: FaPizzaSlice, className: 'left-[90%] top-[56%]', size: 34, duration: 6.1, delay: 1.0 },
  { icon: FaHamburger, className: 'left-[83%] top-[75%]', size: 38, duration: 7.0, delay: 0.4 },
  { icon: FaPepperHot, className: 'left-[58%] top-[90%]', size: 26, duration: 5.7, delay: 1.5 },
];

export default function RegisterPage() {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, isLoading } = useAuth();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    logger.debug('🔐 [REGISTER PAGE] Form submitted');

    // Validation - check in order of importance
    logger.debug('🔍 [REGISTER PAGE] Validating form data...');
    logger.debug('🔍 [REGISTER PAGE] Form state:', {
      email: email.trim() || 'empty',
      phone: phone.trim() || 'empty',
      hasPassword: !!password,
      passwordLength: password.length,
      passwordsMatch: password === confirmPassword,
      acceptTerms,
    });

    if (!acceptTerms) {
      logger.debug('❌ [REGISTER PAGE] Validation failed: Terms not accepted');
      setError(t('register.errors.acceptTerms'));
      setIsSubmitting(false);
      return;
    }

    if (!email.trim() && !phone.trim()) {
      logger.debug('❌ [REGISTER PAGE] Validation failed: No email or phone');
      setError(t('register.errors.emailOrPhoneRequired'));
      setIsSubmitting(false);
      return;
    }

    if (!password) {
      logger.debug('❌ [REGISTER PAGE] Validation failed: No password');
      setError(t('register.errors.passwordRequired'));
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      logger.debug('❌ [REGISTER PAGE] Validation failed: Password too short');
      setError(t('register.errors.passwordMinLength'));
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      logger.debug('❌ [REGISTER PAGE] Validation failed: Passwords do not match');
      setError(t('register.errors.passwordsDoNotMatch'));
      setIsSubmitting(false);
      return;
    }

    logger.debug('✅ [REGISTER PAGE] All validations passed');

    try {
      logger.debug('📤 [REGISTER PAGE] Calling register function...');
      logger.debug('📤 [REGISTER PAGE] Registration data:', {
        email: email.trim() || 'not provided',
        phone: phone.trim() || 'not provided',
        hasPassword: !!password,
        firstName: firstName.trim() || 'not provided',
        lastName: lastName.trim() || 'not provided',
      });
      
      await register({
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        password,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });
      
      logger.debug('✅ [REGISTER PAGE] Registration successful, redirecting...');
      // Redirect is handled by AuthContext
      // But we can also redirect here as a fallback
      setTimeout(() => {
        if (window.location.pathname === '/register') {
          logger.debug('🔄 [REGISTER PAGE] Fallback redirect to home...');
          window.location.href = '/';
        }
      }, 1000);
    } catch (err: any) {
      console.error('❌ [REGISTER PAGE] Registration error:', err);
      console.error('❌ [REGISTER PAGE] Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
      });
      setError(resolveRegisterApiError(err instanceof Error ? err.message : String(err), t));
    } finally {
      setIsSubmitting(false);
    }
  };

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
        src={registerSideAccentUrl}
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
        <h1 className="mb-2 text-center text-3xl font-bold text-[#1F2E1F]">{t('register.title')}</h1>
        <p className="mb-8 text-[#1F2E1F]">{t('register.subtitle')}</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="mb-2 block text-sm font-medium text-[#1F2E1F]">
                {t('register.form.firstName')}
                <span className="ml-0.5 text-red-500">*</span>
              </label>
              <Input
                id="firstName"
                type="text"
                placeholder={t('register.placeholders.firstName')}
                className="w-full border-gray-300 bg-white text-[#1F2E1F] placeholder:text-[#1F2E1F]/70 transition-colors hover:border-[#F66812] focus:border-[#F66812] focus:ring-[#F66812]"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isSubmitting || isLoading}
                required
              />
            </div>
            <div>
              <label htmlFor="lastName" className="mb-2 block text-sm font-medium text-[#1F2E1F]">
                {t('register.form.lastName')}
                <span className="ml-0.5 text-red-500">*</span>
              </label>
              <Input
                id="lastName"
                type="text"
                placeholder={t('register.placeholders.lastName')}
                className="w-full border-gray-300 bg-white text-[#1F2E1F] placeholder:text-[#1F2E1F]/70 transition-colors hover:border-[#F66812] focus:border-[#F66812] focus:ring-[#F66812]"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isSubmitting || isLoading}
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-[#1F2E1F]">
              {t('register.form.email')}
              <span className="ml-0.5 text-red-500">*</span>
            </label>
            <Input
              id="email"
              type="email"
              placeholder={t('register.placeholders.email')}
              className="w-full border-gray-300 bg-white text-[#1F2E1F] placeholder:text-[#1F2E1F]/70 transition-colors hover:border-[#F66812] focus:border-[#F66812] focus:ring-[#F66812]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting || isLoading}
              required
            />
          </div>
          <div>
            <label htmlFor="phone" className="mb-2 block text-sm font-medium text-[#1F2E1F]">
              {t('register.form.phone')}
            </label>
            <Input
              id="phone"
              type="tel"
              placeholder={t('register.placeholders.phone')}
              className="w-full border-gray-300 bg-white text-[#1F2E1F] placeholder:text-[#1F2E1F]/70 transition-colors hover:border-[#F66812] focus:border-[#F66812] focus:ring-[#F66812]"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isSubmitting || isLoading}
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-[#1F2E1F]">
              {t('register.form.password')}
              <span className="ml-0.5 text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('register.placeholders.password')}
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
            <p className="mt-1 text-xs text-[#1F2E1F]/70">
              {t('register.passwordHint')}
            </p>
          </div>
          <div>
            <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-[#1F2E1F]">
              {t('register.form.confirmPassword')}
              <span className="ml-0.5 text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder={t('register.placeholders.confirmPassword')}
                className="w-full border-gray-300 bg-white pr-10 text-[#1F2E1F] placeholder:text-[#1F2E1F]/70 transition-colors hover:border-[#F66812] focus:border-[#F66812] focus:ring-[#F66812]"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting || isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 hidden -translate-y-1/2 text-[#1F2E1F]/70 hover:text-[#1F2E1F] focus:outline-none lg:block"
                disabled={isSubmitting || isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          <div className="flex items-start">
            <input
              type="checkbox"
              id="terms"
              checked={acceptTerms}
              onChange={(e) => {
                setAcceptTerms(e.target.checked);
                // Clear error when checkbox is checked
                if (e.target.checked && error === t('register.errors.acceptTerms')) {
                  setError(null);
                }
              }}
              className="mt-1 rounded border-gray-300 text-[#F66812] focus:ring-[#F66812]"
              disabled={isSubmitting || isLoading}
              required
            />
            <label htmlFor="terms" className="ml-2 text-sm text-[#1F2E1F]">
              {t('register.form.acceptTerms')}{' '}
              <Link href="/terms" className="text-[#F66812] hover:underline">
                {t('register.form.termsOfService')}
              </Link>{' '}
              {t('register.form.and')}{' '}
              <Link href="/privacy" className="text-[#F66812] hover:underline">
                {t('register.form.privacyPolicy')}
              </Link>
            </label>
          </div>
          {!acceptTerms && error === t('register.errors.acceptTerms') && (
            <p className="text-xs text-red-600 -mt-2">{t('register.errors.mustAcceptTerms')}</p>
          )}
          <Button 
            variant="primary" 
            className="w-full border border-[#1F3A22] bg-[#1F3A22] text-white hover:bg-[#18301C]"
            type="submit"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting || isLoading ? t('register.form.creatingAccount') : t('register.form.createAccount')}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-[#1F2E1F]">
            {t('register.form.alreadyHaveAccount')}{' '}
            <Link href="/login" className="font-medium text-[#F66812] hover:underline">
              {t('register.form.signIn')}
            </Link>
          </p>
        </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

