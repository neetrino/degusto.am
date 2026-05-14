'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@shop/ui';
import { formatPrice } from '../../lib/currency';
import type { CurrencyCode } from '../../lib/currency';
import { COUPON_CODE_REGEX } from '../../lib/coupon-code-format';
import {
  CHECKOUT_COUPON_CODE_STORAGE_KEY,
  requestCheckoutCouponValidation,
} from '../checkout/checkout-coupon-client';
import type { Cart, CartItem } from './types';
import type { CartListAppearance } from './constants';

type DisplayLine = NonNullable<CartItem['variant']['displayLines']>[number];

function CartItemVariantChips({ lines, appearance = 'page' }: { lines: DisplayLine[]; appearance?: CartListAppearance }) {
  if (lines.length === 0) {
    return null;
  }

  const isDrawer = appearance === 'drawer';
  const firstPill = isDrawer
    ? 'rounded-full border border-white/40 bg-white/12 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm'
    : 'rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-semibold text-gray-800 shadow-sm';
  const secondPill = isDrawer
    ? 'rounded-full bg-[#1a1a1a] px-2.5 py-0.5 text-xs font-semibold text-white ring-1 ring-inset ring-white/15'
    : 'rounded-full bg-[#1a1a1a] px-2.5 py-0.5 text-xs font-semibold text-white';
  const restPill = isDrawer
    ? 'rounded-full border border-white/25 bg-white/8 px-2 py-0.5 text-[11px] font-medium text-white/85'
    : 'rounded-full border border-gray-200/90 bg-gray-50/90 px-2 py-0.5 text-[11px] font-medium text-gray-600';

  const [first, second, ...rest] = lines;

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-2">
      <span className={firstPill}>{first.valueLabel}</span>
      {second ? <span className={secondPill}>{second.valueLabel}</span> : null}
      {rest.length > 0 ? (
        <span className={restPill}>{rest.map((l) => l.valueLabel).join(' · ')}</span>
      ) : null}
    </div>
  );
}

interface CartItemQuantityStepperProps {
  item: CartItem;
  updatingItems: Set<string>;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  t: (key: string) => string;
  appearance?: CartListAppearance;
}

function CartItemQuantityStepper({
  item,
  updatingItems,
  onUpdateQuantity,
  t,
  appearance = 'page',
}: CartItemQuantityStepperProps) {
  const isDrawer = appearance === 'drawer';
  const stockTitle =
    item.variant.stock !== undefined
      ? t('common.messages.availableQuantity').replace('{stock}', item.variant.stock.toString())
      : '';
  const atMaxStock =
    item.variant.stock !== undefined && item.quantity >= item.variant.stock;

  const shellClass = isDrawer
    ? 'inline-grid h-8 w-[6.25rem] shrink-0 grid-cols-3 divide-x divide-white/25 overflow-hidden rounded-full border border-white/30 bg-white/10 shadow-none sm:h-9 sm:w-[6.75rem]'
    : 'inline-grid h-8 w-[6.25rem] shrink-0 grid-cols-3 divide-x divide-gray-200 overflow-hidden rounded-full border border-gray-200 bg-white shadow-sm sm:h-9 sm:w-[6.75rem]';
  const btnClass = isDrawer
    ? 'flex min-h-0 min-w-0 items-center justify-center text-white transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50'
    : 'flex min-h-0 min-w-0 items-center justify-center text-gray-700 transition-colors hover:bg-gray-50/80 disabled:cursor-not-allowed disabled:opacity-50';
  const midBg = isDrawer ? 'bg-white/5' : 'bg-white';
  const inputClass = isDrawer
    ? 'h-full w-full min-w-0 border-0 bg-transparent px-0.5 text-center text-xs font-semibold tabular-nums text-white outline-none ring-0 focus:ring-0 disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none sm:text-sm'
    : 'h-full w-full min-w-0 border-0 bg-transparent px-0.5 text-center text-xs font-semibold tabular-nums text-gray-900 outline-none ring-0 focus:ring-0 disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none sm:text-sm';

  return (
    <div className={shellClass} title={stockTitle}>
      <button
        type="button"
        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
        disabled={updatingItems.has(item.id)}
        className={btnClass}
        aria-label={t('common.ariaLabels.decreaseQuantity')}
      >
        <span className="flex h-5 w-5 items-center justify-center text-base font-medium leading-none sm:text-lg">
          −
        </span>
      </button>
      <div className={`flex min-h-0 min-w-0 items-center justify-center ${midBg}`}>
        <input
          type="number"
          min={1}
          max={item.variant.stock !== undefined ? item.variant.stock : undefined}
          value={item.quantity}
          onChange={(e) => {
            const next = parseInt(e.target.value, 10) || 1;
            onUpdateQuantity(item.id, next);
          }}
          disabled={updatingItems.has(item.id)}
          className={inputClass}
          aria-label={t('common.messages.quantity')}
        />
      </div>
      <button
        type="button"
        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
        disabled={updatingItems.has(item.id) || atMaxStock}
        className={btnClass}
        aria-label={t('common.ariaLabels.increaseQuantity')}
        title={
          atMaxStock && item.variant.stock !== undefined
            ? t('common.messages.availableQuantity').replace('{stock}', item.variant.stock.toString())
            : t('common.messages.addQuantity')
        }
      >
        <span className="flex h-5 w-5 items-center justify-center text-base font-medium leading-none sm:text-lg">
          +
        </span>
      </button>
    </div>
  );
}

function cartItemRowClassName(appearance: CartListAppearance): string {
  if (appearance === 'drawer') {
    return 'flex gap-3 bg-transparent py-4 sm:gap-4';
  }
  return 'flex gap-3 rounded-2xl bg-gray-100 p-3 sm:gap-4 sm:p-4';
}

function cartItemImageLinkClassName(appearance: CartListAppearance): string {
  const size = 'relative h-20 w-20 shrink-0 overflow-hidden sm:h-24 sm:w-24';
  if (appearance === 'drawer') {
    return `${size} rounded-xl`;
  }
  return `${size} rounded-2xl border border-white bg-white shadow-sm`;
}

/**
 * Cart item row — horizontal card (no table layout).
 */
interface CartItemRowProps {
  item: CartItem;
  currency: string;
  updatingItems: Set<string>;
  onRemove: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  t: (key: string) => string;
  appearance?: CartListAppearance;
}

export function CartItemRow({
  item,
  currency,
  updatingItems,
  onRemove,
  onUpdateQuantity,
  t,
  appearance = 'page',
}: CartItemRowProps) {
  const currencyCode = currency as CurrencyCode;
  const lines = item.variant.displayLines ?? [];
  const isDrawer = appearance === 'drawer';

  return (
    <div className={cartItemRowClassName(appearance)}>
      <Link
        href={`/products/${item.variant.product.slug}`}
        className={cartItemImageLinkClassName(appearance)}
        aria-label={item.variant.product.title}
      >
        {item.variant.product.image ? (
          <Image
            src={item.variant.product.image}
            alt=""
            fill
            className="object-cover"
            sizes="84px"
            unoptimized
          />
        ) : (
          <div
            className={
              isDrawer
                ? 'flex h-full w-full items-center justify-center bg-transparent ring-1 ring-inset ring-white/35'
                : 'flex h-full w-full items-center justify-center bg-gray-100'
            }
          >
            <svg
              className={`h-8 w-8 ${isDrawer ? 'text-white/45' : 'text-gray-400'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
        <div className="min-w-0 pr-1">
          <Link
            href={`/products/${item.variant.product.slug}`}
            className={
              isDrawer
                ? 'line-clamp-2 text-base font-bold text-white transition-colors hover:text-white/90'
                : 'line-clamp-2 text-base font-bold text-gray-900 transition-colors hover:text-[#F66812]'
            }
          >
            {item.variant.product.title}
          </Link>
          {lines.length > 0 ? <CartItemVariantChips lines={lines} appearance={appearance} /> : null}
          {lines.length === 0 && (item.customizations?.additions || item.customizations?.exclusions) ? (
            <ul
              className={`mt-1.5 list-none space-y-0.5 pl-0 text-xs ${isDrawer ? 'text-white/75' : 'text-gray-600'}`}
            >
              {item.customizations?.additions ? (
                <li>
                  <span className={`font-medium ${isDrawer ? 'text-white' : 'text-gray-700'}`}>
                    {t('product.additionsLabel')}:
                  </span>{' '}
                  {item.customizations.additions}
                </li>
              ) : null}
              {item.customizations?.exclusions ? (
                <li>
                  <span className={`font-medium ${isDrawer ? 'text-white' : 'text-gray-700'}`}>
                    {t('product.exclusionsLabel')}:
                  </span>{' '}
                  {item.customizations.exclusions}
                </li>
              ) : null}
            </ul>
          ) : null}
          {lines.length > 0 && item.customizations?.additions ? (
            <p className={`mt-2 text-xs ${isDrawer ? 'text-white/75' : 'text-gray-600'}`}>
              {t('product.additionsLabel')}: {item.customizations.additions}
            </p>
          ) : null}
          {lines.length > 0 && item.customizations?.exclusions ? (
            <p className={`text-xs ${isDrawer ? 'text-white/75' : 'text-gray-600'}`}>
              {t('product.exclusionsLabel')}: {item.customizations.exclusions}
            </p>
          ) : null}
        </div>
        <CartItemQuantityStepper
          item={item}
          updatingItems={updatingItems}
          onUpdateQuantity={onUpdateQuantity}
          t={t}
          appearance={appearance}
        />
      </div>

      <div className="flex shrink-0 flex-col items-end justify-between self-stretch pl-1">
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className={
            isDrawer
              ? 'rounded-xl border border-white/35 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/15 sm:px-3 sm:text-sm'
              : 'rounded-xl border border-red-500 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 sm:px-3 sm:text-sm'
          }
        >
          {t('common.buttons.remove')}
        </button>
        <div className="flex flex-col items-end gap-0.5 text-right">
          <span
            className={`text-lg font-bold tabular-nums sm:text-xl ${isDrawer ? 'text-white' : 'text-gray-900'}`}
          >
            {formatPrice(item.total, currencyCode)}
          </span>
          {item.originalPrice && item.originalPrice > item.price ? (
            <span
              className={`text-xs line-through sm:text-sm ${isDrawer ? 'text-white/50' : 'text-gray-500'}`}
            >
              {formatPrice(item.originalPrice * item.quantity, currencyCode)}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Cart table component
 */
interface CartTableProps {
  cart: Cart;
  currency: string;
  updatingItems: Set<string>;
  onRemove: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  t: (key: string) => string;
  appearance?: CartListAppearance;
}

export function CartTable({
  cart,
  currency,
  updatingItems,
  onRemove,
  onUpdateQuantity,
  t,
  appearance = 'page',
}: CartTableProps) {
  const listClassName =
    appearance === 'drawer'
      ? 'flex flex-col divide-y divide-white/20'
      : 'flex flex-col gap-3';

  return (
    <div className={appearance === 'drawer' ? '' : 'lg:col-span-2'}>
      <div className={listClassName}>
        {cart.items.map((item) => (
          <CartItemRow
            key={item.id}
            item={item}
            currency={currency}
            updatingItems={updatingItems}
            onRemove={onRemove}
            onUpdateQuantity={onUpdateQuantity}
            t={t}
            appearance={appearance}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Order summary — totals + optional promocode (persisted for checkout).
 */
interface OrderSummaryProps {
  cart: Cart;
  currency: string;
  t: (key: string) => string;
  /** Drawer: dark glass + white type (readable on liquid-glass panel). */
  appearance?: CartListAppearance;
}

export function OrderSummary({ cart, currency, t, appearance = 'page' }: OrderSummaryProps) {
  const currencyCode = currency as CurrencyCode;
  const isDrawer = appearance === 'drawer';

  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState('');
  const [promoFeedback, setPromoFeedback] = useState('');
  const [promoDiscountAmount, setPromoDiscountAmount] = useState(0);
  const [applyingPromo, setApplyingPromo] = useState(false);

  const innerClass = isDrawer
    ? 'rounded-2xl border border-white/20 bg-black/40 p-5 shadow-sm backdrop-blur-md sm:p-5'
    : 'rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6';

  const headingClass = `text-lg font-semibold ${isDrawer ? 'mb-4 text-white' : 'mb-5 text-gray-900'}`;
  const bodyGap = isDrawer ? 'mb-5' : 'mb-6';
  const labelClass = isDrawer ? 'text-white/75' : 'text-gray-600';
  const valueClass = isDrawer ? 'font-medium text-white tabular-nums' : 'font-medium text-gray-900 tabular-nums';
  const calcClass = isDrawer ? 'font-medium text-white' : 'font-medium text-gray-900';
  const totalBorder = isDrawer ? 'border-t border-white/25 pt-3' : 'border-t border-gray-200 pt-3';
  const totalRowClass = isDrawer
    ? 'flex justify-between text-base font-semibold text-white'
    : 'flex justify-between text-base font-semibold text-gray-900';

  const promoLabelClass = isDrawer
    ? 'mb-2 block text-sm font-semibold text-white'
    : 'mb-2 block text-sm font-semibold text-[#1F2E1F]';
  const promoInputClass = isDrawer
    ? 'h-10 flex-1 rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#F66812]'
    : 'h-10 flex-1 rounded-lg border border-[#F66812]/25 px-3 py-2 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#F66812]';

  async function validateAndApplyPromoCode(rawCode: string, silent = false) {
    const trimmedCode = rawCode.trim();
    if (!COUPON_CODE_REGEX.test(trimmedCode)) {
      setAppliedPromoCode('');
      setPromoDiscountAmount(0);
      localStorage.removeItem(CHECKOUT_COUPON_CODE_STORAGE_KEY);
      if (!silent) {
        setPromoFeedback(t('common.cart.promoInvalid'));
      }
      return;
    }

    try {
      setApplyingPromo(true);
      const responseData = await requestCheckoutCouponValidation(trimmedCode, cart.totals.subtotal);

      setAppliedPromoCode(responseData.code);
      setPromoDiscountAmount(responseData.discountAmount);
      setPromoCodeInput(responseData.code);
      localStorage.setItem(CHECKOUT_COUPON_CODE_STORAGE_KEY, responseData.code);
      if (!silent) {
        setPromoFeedback(t('common.cart.promoApplied').replace('{code}', responseData.code));
      }
    } catch (error: unknown) {
      setAppliedPromoCode('');
      setPromoDiscountAmount(0);
      localStorage.removeItem(CHECKOUT_COUPON_CODE_STORAGE_KEY);
      if (!silent) {
        const errorMessage = error instanceof Error ? error.message : '';
        setPromoFeedback(errorMessage || t('common.cart.promoInvalid'));
      }
    } finally {
      setApplyingPromo(false);
    }
  }

  useEffect(() => {
    const storedCode = localStorage.getItem(CHECKOUT_COUPON_CODE_STORAGE_KEY);
    if (!storedCode) {
      return;
    }
    const trimmedStored = storedCode.trim();
    if (!trimmedStored) {
      return;
    }
    setPromoCodeInput(trimmedStored);
    void validateAndApplyPromoCode(trimmedStored, true);
  }, [cart.totals.subtotal]);

  const handleApplyPromoCode = () => {
    void validateAndApplyPromoCode(promoCodeInput);
  };

  const displayTotal = Math.max(0, cart.totals.total - promoDiscountAmount);

  return (
    <div className={isDrawer ? '' : 'lg:sticky lg:top-24 lg:col-span-1'}>
      <div className={innerClass}>
        <h2 className={headingClass}>{t('common.cart.orderSummary')}</h2>
        <div className={`space-y-3 text-sm ${bodyGap}`}>
          <div className={`flex justify-between gap-3 ${labelClass}`}>
            <span>{t('common.cart.subtotal')}</span>
            <span className={valueClass}>{formatPrice(cart.totals.subtotal, currencyCode)}</span>
          </div>
          <div className={`flex justify-between gap-3 ${labelClass}`}>
            <span>{t('common.cart.shipping')}</span>
            <span className={calcClass}>{t('common.cart.calculated')}</span>
          </div>
          <div className={isDrawer ? 'border-t border-white/25 pt-3' : 'border-t border-[#F66812]/15 pt-4'}>
            <label htmlFor="cart-promocode" className={promoLabelClass}>
              {t('common.cart.promocode')}
            </label>
            <div className="flex gap-2">
              <input
                id="cart-promocode"
                type="text"
                value={promoCodeInput}
                onChange={(event) => setPromoCodeInput(event.target.value)}
                placeholder={t('common.cart.promocodePlaceholder')}
                className={promoInputClass}
              />
              <Button
                type="button"
                variant="outline"
                size="md"
                className={
                  isDrawer
                    ? 'border-white/40 text-white hover:border-white hover:bg-white/10'
                    : 'border-[#F66812]/40 text-[#F66812] hover:border-[#F66812] hover:bg-[#F66812]/10'
                }
                onClick={handleApplyPromoCode}
                disabled={applyingPromo}
              >
                {applyingPromo ? t('common.cart.applyingPromo') : t('common.cart.applyPromo')}
              </Button>
            </div>
            {promoFeedback ? (
              <p
                className={`mt-2 text-xs ${
                  appliedPromoCode && promoFeedback.includes(appliedPromoCode)
                    ? isDrawer
                      ? 'text-green-300'
                      : 'text-green-600'
                    : isDrawer
                      ? 'text-red-300'
                      : 'text-red-600'
                }`}
              >
                {promoFeedback}
              </p>
            ) : null}
          </div>
          {promoDiscountAmount > 0 ? (
            <div className={`flex justify-between gap-3 ${labelClass}`}>
              <span>{t('common.cart.discount')}</span>
              <span
                className={
                  isDrawer
                    ? 'font-medium text-green-300 tabular-nums'
                    : 'font-semibold text-green-600 tabular-nums'
                }
              >
                -{formatPrice(promoDiscountAmount, currencyCode)}
              </span>
            </div>
          ) : null}
          <div className={totalBorder}>
            <div className={totalRowClass}>
              <span>{t('common.cart.total')}</span>
              <span className="tabular-nums">{formatPrice(displayTotal, currencyCode)}</span>
            </div>
          </div>
        </div>
        <Button
          variant="primary"
          className="w-full !bg-[#F66812] hover:!bg-[#e45f10] focus:!ring-[#F66812]"
          size="lg"
          onClick={() => {
            window.location.href = '/checkout';
          }}
        >
          {t('common.buttons.proceedToCheckout')}
        </Button>
        {!isDrawer ? (
          <Button
            variant="outline"
            className="mt-3 w-full border-[#F66812]/40 text-[#F66812] hover:border-[#F66812] hover:bg-[#F66812]/10"
            size="md"
            onClick={() => {
              window.location.href = '/shop';
            }}
          >
            {t('common.buttons.browseProducts')}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
