'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@shop/ui';
import { getStoredCurrency } from '@/lib/currency';
import { useTranslation } from '@/lib/i18n-client';
import { useAuth } from '@/lib/auth/AuthContext';
import type { Cart } from '@/app/cart/types';
import { fetchCart } from '@/app/cart/cart-fetcher';
import { handleRemoveItem, handleUpdateQuantity } from '@/app/cart/cart-handlers';
import { CartTable, OrderSummary } from '@/app/cart/cart-components';
import { useCartDrawer } from './cart-drawer-context';
import {
  cartDrawerBackdropTransition,
  cartDrawerBackdropVariants,
  cartDrawerBodyStagger,
  cartDrawerFadeUpItem,
  cartDrawerHeaderStagger,
  cartDrawerPanelTransition,
  cartDrawerPanelVariants,
} from './cart-drawer-motion-variants';

/** Liquid-glass cart drawer header: matches panel chrome (blur + tint + specular edge). */
const DRAWER_HEADER_CLASS =
  'relative z-10 flex shrink-0 items-start justify-between bg-gradient-to-br from-white/58 via-white/42 to-white/30 px-5 py-4 ring-1 ring-inset ring-white/35 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:from-white/48 supports-[backdrop-filter]:via-white/36 supports-[backdrop-filter]:to-white/26';

const DRAWER_HEADER_CLOSE_CLASS =
  'flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-white/20 text-white shadow-sm backdrop-blur-md transition-colors hover:border-white/65 hover:bg-white/30 hover:text-white';

/** Liquid-glass drawer shell: blurs page behind; no image/WebGL. */
const DRAWER_PANEL_CLASS =
  'absolute right-0 top-0 z-[200] flex h-full w-full max-w-md flex-col overflow-hidden rounded-l-[2rem] bg-gradient-to-b from-white/78 via-white/68 to-white/58 shadow-2xl backdrop-blur-2xl backdrop-saturate-150 ring-1 ring-inset ring-white/45 supports-[backdrop-filter]:from-white/68 supports-[backdrop-filter]:via-white/58 supports-[backdrop-filter]:to-white/48 sm:rounded-l-[2.25rem]';

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
      className="absolute inset-0 z-[1] bg-black/45 backdrop-blur-[2px]"
      variants={cartDrawerBackdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={cartDrawerBackdropTransition(reduceMotion)}
      onClick={onClose}
    />
  );
}

function CartDrawerMounted({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const panelTransition = cartDrawerPanelTransition(reduceMotion);
  const { isLoggedIn } = useAuth();
  const { t } = useTranslation();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState(getStoredCurrency());
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const isLocalUpdateRef = useRef(false);

  const loadCart = useCallback(async () => {
    try {
      setLoading(true);
      const cartData = await fetchCart(isLoggedIn, t);
      setCart(cartData);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, t]);

  useEffect(() => {
    void loadCart();
  }, [loadCart]);

  useEffect(() => {
    const onCurrency = () => setCurrency(getStoredCurrency());
    const onCartUpdate = () => {
      if (isLocalUpdateRef.current) {
        isLocalUpdateRef.current = false;
        return;
      }
      void loadCart();
    };
    const onAuth = () => {
      void loadCart();
    };
    window.addEventListener('currency-updated', onCurrency);
    window.addEventListener('cart-updated', onCartUpdate);
    window.addEventListener('auth-updated', onAuth);
    return () => {
      window.removeEventListener('currency-updated', onCurrency);
      window.removeEventListener('cart-updated', onCartUpdate);
      window.removeEventListener('auth-updated', onAuth);
    };
  }, [loadCart]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  async function onRemoveItem(itemId: string) {
    if (!cart) return;
    isLocalUpdateRef.current = true;
    await handleRemoveItem(itemId, cart, isLoggedIn, setCart, loadCart);
  }

  async function onUpdateQuantity(itemId: string, quantity: number) {
    isLocalUpdateRef.current = true;
    await handleUpdateQuantity(
      itemId,
      quantity,
      cart,
      isLoggedIn,
      setCart,
      setUpdatingItems,
      loadCart,
      t
    );
  }

  const itemCount = cart?.itemsCount ?? 0;
  const countLabel = itemCount === 1 ? t('common.cart.item') : t('common.cart.items');
  const headerStagger = cartDrawerHeaderStagger(reduceMotion);
  const bodyStagger = cartDrawerBodyStagger(reduceMotion);
  const fadeItem = cartDrawerFadeUpItem(reduceMotion);

  return (
    <div className="fixed inset-0 isolate z-[190]" role="dialog" aria-modal="true" aria-labelledby="cart-drawer-title">
      <CartDrawerBackdrop onClose={onClose} label={t('common.ariaLabels.closeMenu')} reduceMotion={reduceMotion} />
      <motion.div
        className={DRAWER_PANEL_CLASS}
        variants={cartDrawerPanelVariants(panelTransition, reduceMotion)}
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
          className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-4 pb-8"
          variants={bodyStagger}
          initial="hidden"
          animate="visible"
        >
          {loading ? (
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
              <Button
                variant="primary"
                size="md"
                className="mt-6"
                onClick={() => {
                  onClose();
                  router.push('/shop');
                }}
              >
                {t('checkout.buttons.continueShopping')}
              </Button>
            </motion.div>
          ) : (
            <motion.div key="cart" variants={fadeItem} className="flex min-h-full flex-col">
              <motion.div variants={fadeItem} className="shrink-0">
                <CartTable
                  cart={cart}
                  currency={currency}
                  updatingItems={updatingItems}
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
    </div>
  );
}

export function CartDrawer() {
  const { isCartDrawerOpen, closeCartDrawer } = useCartDrawer();

  return (
    <AnimatePresence>
      {isCartDrawerOpen ? <CartDrawerMounted key="cart-drawer" onClose={closeCartDrawer} /> : null}
    </AnimatePresence>
  );
}
