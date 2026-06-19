'use client';

import Link from 'next/link';
import { useTranslation } from '../../../lib/i18n-client';
import {
  CHECKOUT_MODAL_CLOSE_ICON,
  CHECKOUT_MODAL_PANEL,
  CHECKOUT_OUTLINE_BUTTON,
  CHECKOUT_PRIMARY_BUTTON,
  CHECKOUT_TEXT_INK_MUTED,
} from '../checkout-ui';

interface CheckoutLoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CheckoutLoginRequiredModal({ isOpen, onClose }: CheckoutLoginRequiredModalProps) {
  const { t } = useTranslation();

  if (!isOpen) {
    return null;
  }

  const loginHref = '/login?redirect=%2Fcheckout';

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-login-required-title"
      onClick={onClose}
    >
      <div className={CHECKOUT_MODAL_PANEL} onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="checkout-login-required-title" className="text-xl font-bold text-[#1F2E1F]">
            {t('checkout.loginRequired.title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={CHECKOUT_MODAL_CLOSE_ICON}
            aria-label={t('checkout.modals.closeModal')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <p className={`text-sm leading-relaxed ${CHECKOUT_TEXT_INK_MUTED}`}>
          {t('checkout.loginRequired.description')}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href={loginHref} className={`text-center ${CHECKOUT_PRIMARY_BUTTON}`}>
            {t('checkout.loginRequired.login')}
          </Link>
          <Link href="/register" className={`text-center ${CHECKOUT_OUTLINE_BUTTON}`}>
            {t('checkout.loginRequired.register')}
          </Link>
        </div>
      </div>
    </div>
  );
}
