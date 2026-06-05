'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { useCallback, useEffect, useRef } from 'react';
import { getStoredCurrency } from '@/lib/currency';
import { useTranslation } from '@/lib/i18n-client';
import { useAuth } from '@/lib/auth/AuthContext';
import { handleRemoveItem, handleUpdateQuantity } from '@/app/cart/cart-handlers';
import { CartTable, OrderSummary } from '@/app/cart/cart-components';
import { useIsMobileViewport } from '@/hooks/useIsMobileViewport';
import {
  cartDrawerBackdropTransition,
  cartDrawerBackdropVariants,
  cartDrawerBodyStagger,
  cartDrawerFadeUpItem,
  cartDrawerHeaderStagger,
  cartDrawerPanelTransition,
  cartDrawerPanelVariants,
} from './cart-drawer-motion-variants';
import { readCartSummaryCache } from '@/lib/cartSummaryCache';
import { cartHasVisibleItems } from '@/lib/cart/cart-summary-sync';
import { clearLegacyGuestCartLocalStorage } from '@/lib/cart/guest-cart-cookies';
import { useCartDrawer } from './cart-drawer-context';
import { useState } from 'react';

/** Header uses panel glass only — no separate tint (avoids dark band at top on mobile). */
const DRAWER_HEADER_CLASS =
  'relative z-10 flex shrink-0 items-start justify-between bg-transparent px-5 pb-3 pt-5';

const DRAWER_HEADER_CLOSE_CLASS =
  'flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-white/20 text-white shadow-sm backdrop-blur-md transition-colors hover:border-white/65 hover:bg-white/30 hover:text-white';

/** Mobile: full-viewport sheet (no radius), darker glass. Desktop: right drawer, lighter glass. */
const DRAWER_PANEL_CLASS =
  'absolute inset-0 z-[200] flex h-full w-full max-w-none flex-col overflow-hidden rounded-none bg-gradient-to-b from-neutral-950/68 via-neutral-900/62 to-neutral-950/72 shadow-2xl backdrop-blur-2xl backdrop-saturate-150 ring-1 ring-inset ring-white/22 supports-[backdrop-filter]:from-neutral-950/60 supports-[backdrop-filter]:via-neutral-900/55 supports-[backdrop-filter]:to-neutral-950/65 lg:inset-y-0 lg:left-auto lg:right-0 lg:max-w-md lg:rounded-none lg:rounded-l-[2.25rem] lg:from-white/78 lg:via-white/68 lg:to-white/58 lg:ring-white/45 lg:supports-[backdrop-filter]:from-white/68 lg:supports-[backdrop-filter]:via-white/58 lg:supports-[backdrop-filter]:to-white/48';

function CartDrawerBackdrop({
  onClose,
  label,
  reduceMotion,
}: {
  onClose: () => void;
  label: string;
  reduceMotion: boolean | null;
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      className="absolute inset-0 z-[1] hidden bg-black/45 backdrop-blur-[2px] lg:block"
      variants={cartDrawerBackdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={cartDrawerBackdropTransition(reduceMotion)}
      onClick={onClose}
    />
  );
}

function CartDrawerMounted({ onClose, isVisible }: { onClose: () => void; isVisible: boolean }) {
  const isMobileViewport = useIsMobileViewport();
  const reduceMotion = useReducedMotion();
  const panelTransition = cartDrawerPanelTransition(reduceMotion, { fullScreen: isMobileViewport });
  const { isLoggedIn } = useAuth();
  const { t } = useTranslation();
  const {
    cart,
    setCart,
    cartLoading,
    reloadCart,
  } = useCartDrawer();
  const [currency, setCurrency] = useState(getStoredCurrency());
  const isLocalUpdateRef = useRef(false);

  useEffect(() => {
    clearLegacyGuestCartLocalStorage();
  }, []);

  useEffect(() => {
    if (!isVisible || cartLoading) {
      return;
    }

    if (cartHasVisibleItems(cart)) {
      return;
    }

    const cached = readCartSummaryCache();
    if ((cached?.itemsCount ?? 0) === 0 && cart !== null) {
      return;
    }

    void reloadCart({ silent: true });
  }, [isVisible, cart, cartLoading, reloadCart]);

  useEffect(() => {
    const onCurrency = () => setCurrency(getStoredCurrency());
    const onAuth = () => {
      void reloadCart({ silent: true });
    };
    window.addEventListener('currency-updated', onCurrency);
    window.addEventListener('auth-updated', onAuth);
    return () => {
      window.removeEventListener('currency-updated', onCurrency);
      window.removeEventListener('auth-updated', onAuth);
    };
  }, [reloadCart]);

  useEffect(() => {
    if (!isVisible) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isVisible, onClose]);

  useEffect(() => {
    if (!isVisible) {
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isVisible]);

  const loadCartWithLoading = useCallback(async () => {
    await reloadCart({ silent: true });
  }, [reloadCart]);

  async function onRemoveItem(itemId: string) {
    if (!cart) return;
    isLocalUpdateRef.current = true;
    await handleRemoveItem(itemId, cart, isLoggedIn, setCart, loadCartWithLoading);
  }

  async function onUpdateQuantity(itemId: string, quantity: number) {
    isLocalUpdateRef.current = true;
    await handleUpdateQuantity(
      itemId,
      quantity,
      cart,
      isLoggedIn,
      setCart,
      loadCartWithLoading,
      t
    );
  }

  const itemCount = cart?.itemsCount ?? 0;
  const countLabel = itemCount === 1 ? t('common.cart.item') : t('common.cart.items');
  const headerStagger = cartDrawerHeaderStagger(reduceMotion, { fullScreen: isMobileViewport });
  const bodyStagger = cartDrawerBodyStagger(reduceMotion, { fullScreen: isMobileViewport });
  const fadeItem = cartDrawerFadeUpItem(reduceMotion, { fullScreen: isMobileViewport });
  const cachedItemsCount = readCartSummaryCache()?.itemsCount ?? 0;
  const showLoading =
    cartLoading && cachedItemsCount > 0 && !cartHasVisibleItems(cart);

  if (!isVisible) {
    return (
      <div className="pointer-events-none invisible fixed inset-0 isolate z-[190]" aria-hidden />
    );
  }

  return (
    <motion.div
      className="fixed inset-0 isolate z-[190]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <CartDrawerBackdrop onClose={onClose} label={t('common.ariaLabels.closeMenu')} reduceMotion={reduceMotion} />
      <motion.div
        className={DRAWER_PANEL_CLASS}
        variants={cartDrawerPanelVariants(panelTransition, reduceMotion, {
          fullScreen: isMobileViewport,
        })}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <motion.div
          className={DRAWER_HEADER_CLASS}
          variants={headerStagger}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeItem}>
            <h2 id="cart-drawer-title" className="text-lg font-bold text-white">
              {t('common.cart.title')}
            </h2>
            <p className="mt-0.5 text-sm text-white/75">
              ({itemCount} {countLabel})
            </p>
          </motion.div>
          <motion.div variants={fadeItem}>
            <button
              type="button"
              onClick={onClose}
              className={DRAWER_HEADER_CLOSE_CLASS}
              aria-label={t('common.ariaLabels.closeMenu')}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        </motion.div>

        <motion.div
          className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden px-4 pt-4 pb-8"
          variants={bodyStagger}
          initial="hidden"
          animate="visible"
        >
          {showLoading ? (
            <motion.div
              key="loading"
              variants={fadeItem}
              className="flex flex-col items-center justify-center gap-3 py-16 text-white/80"
            >
              <span
                className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white"
                aria-hidden
              />
              <span className="text-sm">{t('common.messages.loading')}</span>
            </motion.div>
          ) : !cart || cart.items.length === 0 ? (
            <motion.div
              key="empty"
              variants={fadeItem}
              className="flex flex-col items-center justify-center px-2 py-16 text-center"
            >
              <p className="text-base font-semibold text-white">{t('common.cart.empty')}</p>
              <Link
                href="/shop"
                onClick={onClose}
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-base font-medium text-white transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
              >
                {t('checkout.buttons.continueShopping')}
              </Link>
            </motion.div>
          ) : (
            <motion.div key="cart" variants={fadeItem} className="flex min-h-0 flex-1 flex-col">
              <motion.div variants={fadeItem} className="scrollbar-hide min-h-0 flex-1 overflow-y-auto">
                <CartTable
                  cart={cart}
                  currency={currency}
                  onRemove={onRemoveItem}
                  onUpdateQuantity={onUpdateQuantity}
                  t={t}
                  appearance="drawer"
                />
              </motion.div>
              <motion.div variants={fadeItem} className="mt-auto shrink-0 pt-8">
                <OrderSummary cart={cart} currency={currency} t={t} appearance="drawer" />
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export function CartDrawer() {
  const { isCartDrawerOpen, closeCartDrawer } = useCartDrawer();

  return <CartDrawerMounted onClose={closeCartDrawer} isVisible={isCartDrawerOpen} />;
}
