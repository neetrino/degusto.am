'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@shop/ui';
import { formatPrice } from '../../lib/currency';
import type { CurrencyCode } from '../../lib/currency';
import type { Cart, CartItem } from './types';

function cartVariantGroupHeading(attributeKey: string, t: (key: string) => string): string {
  const k = attributeKey.toLowerCase().trim();
  if (k === 'color' || k === 'colour') {
    return t('orders.itemDetails.color');
  }
  if (k === 'size') {
    return t('orders.itemDetails.size');
  }
  return attributeKey.charAt(0).toUpperCase() + attributeKey.slice(1).replace(/-/g, ' ');
}

/**
 * Cart item row component
 */
interface CartItemRowProps {
  item: CartItem;
  currency: string;
  updatingItems: Set<string>;
  onRemove: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  t: (key: string) => string;
}

export function CartItemRow({
  item,
  currency,
  updatingItems,
  onRemove,
  onUpdateQuantity,
  t,
}: CartItemRowProps) {
  const currencyCode = currency as CurrencyCode;

  return (
    <div className="relative grid grid-cols-1 gap-5 px-4 py-5 transition-colors hover:bg-[#F66812]/[0.04] sm:px-6 md:grid-cols-9 md:gap-6">
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:border-[#F66812]/40 hover:bg-[#F66812]/10 hover:text-[#F66812]"
        aria-label={t('common.buttons.remove')}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex items-start gap-4 md:col-span-3">
        <Link
          href={`/products/${item.variant.product.slug}`}
          className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-100 sm:h-28 sm:w-28"
        >
          {item.variant.product.image ? (
            <Image
              src={item.variant.product.image}
              alt={item.variant.product.title}
              fill
              className="object-cover"
              sizes="112px"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            href={`/products/${item.variant.product.slug}`}
            className="line-clamp-2 text-base font-semibold text-gray-900 transition-colors hover:text-[#F66812]"
          >
            {item.variant.product.title}
          </Link>
          {item.variant.displayLines && item.variant.displayLines.length > 0 ? (
            <ul className="mt-1 list-none space-y-0.5 pl-0 text-xs text-gray-600">
              {item.variant.displayLines.map((line) => (
                <li key={`${line.attributeKey}:${line.valueLabel}`}>
                  <span className="font-medium text-gray-700">
                    {cartVariantGroupHeading(line.attributeKey, t)}:
                  </span>{' '}
                  {line.valueLabel}
                </li>
              ))}
            </ul>
          ) : null}
          {item.customizations?.additions && (
            <p className="mt-2 text-xs text-gray-600">
              {t('product.additionsLabel')}: {item.customizations.additions}
            </p>
          )}
          {item.customizations?.exclusions && (
            <p className="text-xs text-gray-600">
              {t('product.exclusionsLabel')}: {item.customizations.exclusions}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col items-start justify-center md:col-span-3 md:items-center">
        <p className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase md:hidden">
          {t('common.messages.quantity')}
        </p>
        <div className="flex w-full items-center justify-center gap-2 md:w-auto">
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            disabled={updatingItems.has(item.id)}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-[#F66812]/25 bg-[#F66812]/[0.06] text-[#F66812] transition-colors hover:bg-[#F66812]/[0.14] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={t('common.ariaLabels.decreaseQuantity')}
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <input
            type="number"
            min="1"
            max={item.variant.stock !== undefined ? item.variant.stock : undefined}
            value={item.quantity}
            onChange={(e) => {
              const newQuantity = parseInt(e.target.value) || 1;
              onUpdateQuantity(item.id, newQuantity);
            }}
            disabled={updatingItems.has(item.id)}
            className="h-9 w-20 rounded-lg border border-[#F66812]/25 bg-white pl-2 pr-5 text-right font-semibold text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#F66812] disabled:opacity-50"
            title={item.variant.stock !== undefined ? t('common.messages.availableQuantity').replace('{stock}', item.variant.stock.toString()) : ''}
          />
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            disabled={updatingItems.has(item.id) || (item.variant.stock !== undefined && item.quantity >= item.variant.stock)}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-[#F66812]/25 bg-[#F66812]/[0.06] text-[#F66812] transition-colors hover:bg-[#F66812]/[0.14] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={t('common.ariaLabels.increaseQuantity')}
            title={item.variant.stock !== undefined && item.quantity >= item.variant.stock ? t('common.messages.availableQuantity').replace('{stock}', item.variant.stock.toString()) : t('common.messages.addQuantity')}
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:col-span-3 md:items-end md:justify-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 md:hidden">
          {t('common.messages.subtotal')}
        </p>
        <div className="mt-1 flex flex-col gap-1 md:mt-0 md:items-end">
          <span className="text-lg font-bold text-[#F66812]">
            {formatPrice(item.total, currencyCode)}
          </span>
          {item.originalPrice && item.originalPrice > item.price && (
            <span className="text-sm text-gray-500 line-through">
              {formatPrice(item.originalPrice * item.quantity, currencyCode)}
            </span>
          )}
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
}

export function CartTable({
  cart,
  currency,
  updatingItems,
  onRemove,
  onUpdateQuantity,
  t,
}: CartTableProps) {
  return (
    <div className="lg:col-span-2">
      <div className="overflow-hidden rounded-2xl border border-[#F66812]/20 bg-white shadow-sm">
        <div className="hidden border-b border-[#F66812]/15 bg-[#F66812]/[0.05] px-6 py-4 md:grid md:grid-cols-9 md:gap-6">
          <div className="md:col-span-3">
            <span className="text-sm font-semibold uppercase tracking-wide text-[#1F2E1F]">{t('common.messages.product')}</span>
          </div>
          <div className="text-center md:col-span-3">
            <span className="text-sm font-semibold uppercase tracking-wide text-[#1F2E1F]">{t('common.messages.quantity')}</span>
          </div>
          <div className="text-right md:col-span-3">
            <span className="text-sm font-semibold uppercase tracking-wide text-[#1F2E1F]">{t('common.messages.subtotal')}</span>
          </div>
        </div>

        <div className="divide-y divide-[#F66812]/10">
          {cart.items.map((item) => (
            <CartItemRow
              key={item.id}
              item={item}
              currency={currency}
              updatingItems={updatingItems}
              onRemove={onRemove}
              onUpdateQuantity={onUpdateQuantity}
              t={t}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Order summary component
 */
interface OrderSummaryProps {
  cart: Cart;
  currency: string;
  t: (key: string) => string;
}

const COUPON_CODE_STORAGE_KEY = 'checkout_coupon_code';

interface CouponValidationResponse {
  data: {
    code: string;
    discountAmount: number;
    totalAfterDiscount?: number;
  };
}

interface ProblemDetailsResponse {
  detail?: string;
}

async function requestCouponValidation(
  couponCode: string,
  subtotal: number
): Promise<CouponValidationResponse['data']> {
  const response = await fetch('/api/v1/cart/coupon/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      couponCode,
      subtotal,
    }),
  });

  const responseBody = (await response.json()) as
    | CouponValidationResponse
    | ProblemDetailsResponse;

  if (!response.ok) {
    const detail =
      typeof (responseBody as ProblemDetailsResponse).detail === 'string'
        ? (responseBody as ProblemDetailsResponse).detail
        : 'Coupon is invalid';
    throw new Error(detail);
  }

  return (responseBody as CouponValidationResponse).data;
}

export function OrderSummary({ cart, currency, t }: OrderSummaryProps) {
  const currencyCode = currency as CurrencyCode;
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState('');
  const [promoFeedback, setPromoFeedback] = useState('');
  const [promoDiscountAmount, setPromoDiscountAmount] = useState(0);
  const [applyingPromo, setApplyingPromo] = useState(false);

  async function validateAndApplyPromoCode(rawCode: string, silent = false) {
    const normalizedCode = rawCode.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,32}$/.test(normalizedCode)) {
      setAppliedPromoCode('');
      setPromoDiscountAmount(0);
      localStorage.removeItem(COUPON_CODE_STORAGE_KEY);
      if (!silent) {
        setPromoFeedback(t('common.cart.promoInvalid'));
      }
      return;
    }

    try {
      setApplyingPromo(true);
      const responseData = await requestCouponValidation(
        normalizedCode,
        cart.totals.subtotal
      );

      setAppliedPromoCode(responseData.code);
      setPromoDiscountAmount(responseData.discountAmount);
      setPromoCodeInput(responseData.code);
      localStorage.setItem(COUPON_CODE_STORAGE_KEY, responseData.code);
      if (!silent) {
        setPromoFeedback(
          t('common.cart.promoApplied').replace('{code}', responseData.code)
        );
      }
    } catch (error: unknown) {
      setAppliedPromoCode('');
      setPromoDiscountAmount(0);
      localStorage.removeItem(COUPON_CODE_STORAGE_KEY);
      if (!silent) {
        const errorMessage = error instanceof Error ? error.message : '';
        setPromoFeedback(errorMessage || t('common.cart.promoInvalid'));
      }
    } finally {
      setApplyingPromo(false);
    }
  }

  useEffect(() => {
    const storedCode = localStorage.getItem(COUPON_CODE_STORAGE_KEY);
    if (!storedCode) {
      return;
    }
    const normalizedCode = storedCode.trim().toUpperCase();
    if (!normalizedCode) {
      return;
    }
    setPromoCodeInput(normalizedCode);
    void validateAndApplyPromoCode(normalizedCode, true);
  }, [cart.totals.subtotal]);

  const handleApplyPromoCode = () => {
    void validateAndApplyPromoCode(promoCodeInput);
  };

  const displayTotal = Math.max(0, cart.totals.total - promoDiscountAmount);

  return (
    <div className="lg:col-span-1">
      <div className="rounded-2xl border border-[#F66812]/20 bg-white p-6 shadow-sm lg:sticky lg:top-24">
        <h2 className="mb-6 text-2xl font-bold text-[#1F2E1F]">
          {t('common.cart.orderSummary')}
        </h2>
        <div className="mb-6 space-y-4">
          <div className="flex justify-between text-gray-600">
            <span>{t('common.messages.quantity')}</span>
            <span className="font-semibold text-gray-900">{cart.itemsCount}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>{t('common.cart.subtotal')}</span>
            <span className="font-semibold text-gray-900">{formatPrice(cart.totals.subtotal, currencyCode)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>{t('common.cart.shipping')}</span>
            <span className="font-semibold text-gray-900">{t('common.cart.calculated')}</span>
          </div>
          <div className="border-t border-[#F66812]/15 pt-4">
            <label
              htmlFor="cart-promocode"
              className="mb-2 block text-sm font-semibold text-[#1F2E1F]"
            >
              {t('common.cart.promocode')}
            </label>
            <div className="flex gap-2">
              <input
                id="cart-promocode"
                type="text"
                value={promoCodeInput}
                onChange={(event) => setPromoCodeInput(event.target.value)}
                placeholder={t('common.cart.promocodePlaceholder')}
                className="h-10 flex-1 rounded-lg border border-[#F66812]/25 px-3 py-2 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#F66812]"
              />
              <Button
                type="button"
                variant="outline"
                size="md"
                className="border-[#F66812]/40 text-[#F66812] hover:border-[#F66812] hover:bg-[#F66812]/10"
                onClick={handleApplyPromoCode}
                disabled={applyingPromo}
              >
                {applyingPromo
                  ? t('common.cart.applyingPromo')
                  : t('common.cart.applyPromo')}
              </Button>
            </div>
            {promoFeedback ? (
              <p
                className={`mt-2 text-xs ${
                  appliedPromoCode && promoFeedback.includes(appliedPromoCode)
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {promoFeedback}
              </p>
            ) : null}
          </div>
          {promoDiscountAmount > 0 ? (
            <div className="flex justify-between text-gray-600">
              <span>{t('common.cart.discount')}</span>
              <span className="font-semibold text-green-600">
                -{formatPrice(promoDiscountAmount, currencyCode)}
              </span>
            </div>
          ) : null}
          <div className="border-t border-[#F66812]/15 pt-4">
            <div className="flex justify-between text-xl font-bold text-[#1F2E1F]">
              <span>{t('common.cart.total')}</span>
              <span>{formatPrice(displayTotal, currencyCode)}</span>
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
      </div>
    </div>
  );
}

