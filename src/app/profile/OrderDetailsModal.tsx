import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, Card } from '@shop/ui';
import { formatPriceInCurrency, convertPrice, type CurrencyCode } from '../../lib/currency';
import { useTranslation } from '../../lib/i18n-client';
import { getStatusColor, getPaymentStatusColor, getColorValue } from './utils';
import { formatOrderStatusLabel } from '../../lib/order-status-labels';
import { formatHydrationSafeDate } from '../../lib/format-date';
import type { OrderDetails } from './types';

interface OrderDetailsModalProps {
  selectedOrder: OrderDetails;
  orderDetailsLoading: boolean;
  orderDetailsError: string | null;
  isReordering: boolean;
  currency: CurrencyCode;
  onClose: () => void;
  onReOrder: () => void;
  t: (key: string) => string;
}

export function OrderDetailsModal({
  selectedOrder,
  orderDetailsLoading,
  orderDetailsError,
  isReordering,
  currency,
  onClose,
  onReOrder,
  t,
}: OrderDetailsModalProps) {
  const { getAttributeLabel: getLocalizedAttributeLabel } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    const body = document.body;
    const scrollY = window.scrollY;
    const previousPosition = body.style.position;
    const previousTop = body.style.top;
    const previousWidth = body.style.width;
    const previousOverflow = body.style.overflow;

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    body.style.overflow = 'hidden';

    return () => {
      body.style.position = previousPosition;
      body.style.top = previousTop;
      body.style.width = previousWidth;
      body.style.overflow = previousOverflow;
      window.scrollTo(0, scrollY);
    };
  }, []);

  const attributeLabelKeyBySlug: Record<string, string> = {
    color: 'profile.orderDetails.color',
    colour: 'profile.orderDetails.color',
    size: 'profile.orderDetails.size',
    sauce: 'profile.orderDetails.sauce',
    sauces: 'profile.orderDetails.sauce',
    addition: 'profile.orderDetails.additions',
    additions: 'profile.orderDetails.additions',
    exclusion: 'profile.orderDetails.exclusions',
    exclusions: 'profile.orderDetails.exclusions',
  };

  const getAttributeLabel = (key: string): string => {
    const normalized = key.toLowerCase().trim();
    const translationKey = attributeLabelKeyBySlug[normalized];
    if (translationKey) {
      return t(translationKey);
    }
    return key.charAt(0).toUpperCase() + key.slice(1);
  };

  const getColorsArray = (colors: any): string[] => {
    if (!colors) return [];
    if (Array.isArray(colors)) return colors;
    if (typeof colors === 'string') {
      try {
        const parsed = JSON.parse(colors);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const hasArmenianChars = (value: string): boolean => /[\u0531-\u058F]/.test(value);

  const attributeTypeByOptionKey: Record<string, string[]> = {
    color: ['color'],
    colour: ['color'],
    size: ['size'],
    sauce: ['sauce'],
    sauces: ['sauce'],
    garlic: ['garlic'],
    greens: ['greens'],
    spicy: ['spicy'],
    ingredient: ['ingredient'],
    topping: ['topping'],
    addition: ['ingredient', 'topping', 'sauce', 'garlic', 'greens', 'spicy'],
    additions: ['ingredient', 'topping', 'sauce', 'garlic', 'greens', 'spicy'],
    exclusion: ['ingredient', 'topping', 'sauce', 'garlic', 'greens', 'spicy'],
    exclusions: ['ingredient', 'topping', 'sauce', 'garlic', 'greens', 'spicy'],
  };

  const attributeValueAliases: Record<string, string> = {
    'barbecue sauce': 'barbecue',
    bbq: 'barbecue',
    'garlic sauce': 'garlic-sauce',
    'no sauce': 'no-sauce',
    'with garlic': 'with-garlic',
    'without garlic': 'without-garlic',
    'with greens': 'with-greens',
    'without greens': 'without-greens',
    'not spicy': 'not-spicy',
  };

  const normalizeAttributeValueCode = (value: string): string => {
    const normalized = value.toLowerCase().trim().replace(/\s+/g, ' ');
    const alias = attributeValueAliases[normalized];
    if (alias) {
      return alias;
    }
    return normalized.replace(/\s+/g, '-');
  };

  const localizeAttributeToken = (token: string, optionKey: string): string => {
    const value = token.trim();
    if (!value) {
      return token;
    }
    if (hasArmenianChars(value)) {
      return value;
    }

    const normalizedOptionKey = optionKey.toLowerCase().trim();
    const targetTypes = attributeTypeByOptionKey[normalizedOptionKey] ?? [];
    const normalizedCode = normalizeAttributeValueCode(value);

    for (const type of targetTypes) {
      const translated = getLocalizedAttributeLabel(type, normalizedCode);
      if (translated !== normalizedCode) {
        return translated;
      }
    }

    return value;
  };

  const localizeOptionValue = (optionKey: string, value: string): string => {
    const parts = value.split(',').map((part) => part.trim()).filter(Boolean);
    if (parts.length === 0) {
      return value;
    }
    return parts.map((part) => localizeAttributeToken(part, optionKey)).join(', ');
  };

  if (!isMounted) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[10000] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative z-10 flex min-h-full items-stretch justify-end p-0" onClick={onClose}>
        <div
          className="relative h-[100dvh] w-full max-w-[980px] transform overflow-hidden border-l border-[#e8ecef] bg-white shadow-[0_18px_48px_rgba(18,29,23,0.22)] transition-all md:rounded-l-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-5">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{t('profile.orderDetails.title')}{selectedOrder.number}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {t('profile.orderDetails.placedOn')} {formatHydrationSafeDate(selectedOrder.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={onReOrder}
                disabled={isReordering}
                variant="primary"
                size="sm"
              >
                {isReordering ? t('profile.orderDetails.adding') : t('profile.orderDetails.reorder')}
              </Button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
                aria-label={t('profile.orderDetails.close')}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="h-[calc(100dvh-76px)] overflow-y-auto px-4 py-4 sm:px-5">
            {orderDetailsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-gray-600">{t('profile.orderDetails.loading')}</p>
              </div>
            ) : orderDetailsError ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">{orderDetailsError}</p>
                <Button onClick={onClose} variant="outline">{t('profile.orderDetails.close')}</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Order Details */}
                <div className="space-y-4">
                  {/* Status */}
                  <Card className="p-4 sm:p-5">
                    <h3 className="mb-3 text-lg font-semibold text-gray-900">{t('profile.orderDetails.orderStatus')}</h3>
                    <div className="flex flex-wrap items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                        {formatOrderStatusLabel(t, selectedOrder.status, 'order')}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(selectedOrder.paymentStatus)}`}>
                        {t('profile.orderDetails.payment')}: {formatOrderStatusLabel(t, selectedOrder.paymentStatus, 'payment')}
                      </span>
                    </div>
                  </Card>

                  {/* Order Items */}
                  <Card className="p-4 sm:p-5">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">{t('profile.orderDetails.orderItems')}</h3>
                    <div className="space-y-3">
                      {selectedOrder.items.map((item, index) => {
                        const allOptions = item.variantOptions || [];
                        
                        return (
                          <div
                            key={index}
                            className="flex gap-3 rounded-xl border border-[#e7ebef] bg-[#fcfcfd] p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
                          >
                            {item.imageUrl && (
                              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-[#dfe4ea] bg-gray-100">
                                <img 
                                  src={item.imageUrl} 
                                  alt={item.productTitle}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="mb-1.5 flex items-start justify-between gap-3">
                                <h4 className="text-[1.08rem] font-semibold leading-6 text-[#111827]">{item.productTitle}</h4>
                                <p className="whitespace-nowrap text-sm font-semibold text-[#344054]">
                                  {t('profile.orderDetails.quantity')}: {item.quantity} × {(() => {
                                    const priceAMD = convertPrice(item.price, 'USD', 'AMD');
                                    const priceDisplay = currency === 'AMD' ? priceAMD : convertPrice(priceAMD, 'AMD', currency);
                                    return formatPriceInCurrency(priceDisplay, currency);
                                  })()} = {(() => {
                                    const totalAMD = convertPrice(item.total, 'USD', 'AMD');
                                    const totalDisplay = currency === 'AMD' ? totalAMD : convertPrice(totalAMD, 'AMD', currency);
                                    return formatPriceInCurrency(totalDisplay, currency);
                                  })()}
                                </p>
                              </div>
                              
                              {/* Display all variation options */}
                              {allOptions.length > 0 && (
                                <div className="mb-2 mt-2 space-y-1.5">
                                  {allOptions.map((opt, optIndex) => {
                                    if (!opt.attributeKey || !opt.value) return null;
                                    
                                    const attributeKey = opt.attributeKey.toLowerCase().trim();
                                    const isColor = attributeKey === 'color' || attributeKey === 'colour';
                                    const optionValue = String(opt.value);
                                    const optionLabel = opt.label ? String(opt.label) : '';
                                    const baseLabel = hasArmenianChars(optionValue)
                                      ? optionValue
                                      : optionLabel || optionValue;
                                    const displayLabel = localizeOptionValue(attributeKey, baseLabel);
                                    const hasImage = opt.imageUrl && opt.imageUrl.trim() !== '';
                                    const colors = getColorsArray(opt.colors);
                                    const colorHex = colors.length > 0 ? colors[0] : (isColor ? getColorValue(opt.value) : null);
                                    
                                    return (
                                      <div key={optIndex} className="flex flex-wrap items-center gap-2 text-[13px] leading-5 text-gray-700">
                                        <span className="rounded-md bg-[#f1f5f9] px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.02em] text-[#475467]">
                                          {getAttributeLabel(opt.attributeKey)}:
                                        </span>
                                        <div className="flex min-w-0 items-center gap-2">
                                          {hasImage ? (
                                            <img 
                                              src={opt.imageUrl!} 
                                              alt={displayLabel}
                                              className="w-6 h-6 rounded border border-gray-300 object-cover"
                                              onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                              }}
                                            />
                                          ) : isColor && colorHex ? (
                                            <div 
                                              className="w-5 h-5 rounded-full border border-gray-300"
                                              style={{ backgroundColor: colorHex }}
                                              title={displayLabel}
                                            />
                                          ) : null}
                                          <span className="break-words font-medium text-[#1f2937]">
                                            {displayLabel}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              
                              <p className="text-xs font-medium text-[#667085]">{t('profile.orderDetails.sku')}: {item.sku}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </div>

                {/* Order Summary + Shipping (moved below order items) */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <Card className="p-4 sm:p-5">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">{t('profile.orderDetails.orderSummary')}</h3>
                    <div className="mb-4 space-y-3">
                      {selectedOrder.totals ? (
                        <>
                          <div className="flex justify-between text-gray-600">
                            <span>{t('profile.orderDetails.subtotal')}</span>
                            <span>
                              {(() => {
                                const subtotalAMD = convertPrice(selectedOrder.totals.subtotal, 'USD', 'AMD');
                                const subtotalDisplay = currency === 'AMD' ? subtotalAMD : convertPrice(subtotalAMD, 'AMD', currency);
                                return formatPriceInCurrency(subtotalDisplay, currency);
                              })()}
                            </span>
                          </div>
                          {selectedOrder.totals.discount > 0 && (
                            <div className="flex justify-between text-gray-600">
                              <span>{t('profile.orderDetails.discount')}</span>
                              <span>
                                -{(() => {
                                  const discountAMD = convertPrice(selectedOrder.totals.discount, 'USD', 'AMD');
                                  const discountDisplay = currency === 'AMD' ? discountAMD : convertPrice(discountAMD, 'AMD', currency);
                                  return formatPriceInCurrency(discountDisplay, currency);
                                })()}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between text-gray-600">
                            <span>{t('profile.orderDetails.shipping')}</span>
                            <span>
                              {selectedOrder.shippingMethod === 'pickup' 
                                ? t('checkout.shipping.freePickup')
                                : (() => {
                                    const shippingAMD = selectedOrder.totals.shipping;
                                    const shippingDisplay = currency === 'AMD' ? shippingAMD : convertPrice(shippingAMD, 'AMD', currency);
                                    return formatPriceInCurrency(shippingDisplay, currency) + (selectedOrder.shippingAddress?.city ? ` (${selectedOrder.shippingAddress.city})` : '');
                                  })()}
                            </span>
                          </div>
                          <div className="border-t border-gray-200 pt-3">
                            <div className="flex justify-between text-lg font-bold text-gray-900">
                              <span>{t('profile.orderDetails.total')}</span>
                              <span>
                                {(() => {
                                  const subtotalAMD = convertPrice(selectedOrder.totals.subtotal, 'USD', 'AMD');
                                  const discountAMD = convertPrice(selectedOrder.totals.discount, 'USD', 'AMD');
                                  const shippingAMD = selectedOrder.totals.shipping;
                                  const taxAMD = convertPrice(selectedOrder.totals.tax, 'USD', 'AMD');
                                  const totalAMD = subtotalAMD - discountAMD + shippingAMD + taxAMD;
                                  const totalDisplay = currency === 'AMD' ? totalAMD : convertPrice(totalAMD, 'AMD', currency);
                                  return formatPriceInCurrency(totalDisplay, currency);
                                })()}
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-gray-600">{t('profile.orderDetails.loadingTotals')}</div>
                      )}
                    </div>
                  </Card>

                  {/* Shipping Method */}
                  <Card className="p-4 sm:p-5">
                    <h3 className="mb-3 text-lg font-semibold text-gray-900">{t('profile.orderDetails.shippingMethod')}</h3>
                    <div className="text-gray-700 space-y-3">
                      <div>
                        <span className="font-medium">{t('profile.orderDetails.method')}: </span>
                        <span className="capitalize">
                          {selectedOrder.shippingMethod === 'delivery' ? t('profile.orderDetails.delivery') : 
                           selectedOrder.shippingMethod === 'pickup' ? t('profile.orderDetails.pickup') : 
                           selectedOrder.shippingMethod || t('profile.orderDetails.notSpecified')}
                        </span>
                      </div>
                      {selectedOrder.shippingMethod === 'delivery' && selectedOrder.shippingAddress && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="font-medium text-gray-900 mb-2">{t('profile.orderDetails.deliveryAddress')}:</p>
                          <div className="text-gray-600">
                            {selectedOrder.shippingAddress.firstName && selectedOrder.shippingAddress.lastName && (
                              <p>{selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}</p>
                            )}
                            {selectedOrder.shippingAddress.addressLine1 && <p>{selectedOrder.shippingAddress.addressLine1}</p>}
                            {selectedOrder.shippingAddress.addressLine2 && <p>{selectedOrder.shippingAddress.addressLine2}</p>}
                            {selectedOrder.shippingAddress.city && (
                              <p>
                                {selectedOrder.shippingAddress.city}
                                {selectedOrder.shippingAddress.postalCode && `, ${selectedOrder.shippingAddress.postalCode}`}
                              </p>
                            )}
                            {selectedOrder.shippingAddress.countryCode && <p>{selectedOrder.shippingAddress.countryCode}</p>}
                            {selectedOrder.shippingAddress.phone && <p className="mt-2">{t('profile.orderDetails.phone')}: {selectedOrder.shippingAddress.phone}</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}



