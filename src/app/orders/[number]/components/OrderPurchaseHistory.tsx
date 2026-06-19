'use client';

import { useTranslation } from '../../../../lib/i18n-client';
import { formatPriceInCurrency, convertPrice, type CurrencyCode } from '../../../../lib/currency';
import { ORDER_SUCCESS_CARD, ORDER_SUCCESS_ITEM_IMAGE } from '../order-success-ui';
import type { Order, OrderItem } from '../types';

interface OrderPurchaseHistoryProps {
  items: OrderItem[];
  currency: CurrencyCode;
  totals: Order['totals'];
  shippingMethod: string;
}

function toDisplayAmount(amountUsd: number, currency: CurrencyCode): number {
  const amountAmd = convertPrice(amountUsd, 'USD', 'AMD');
  return currency === 'AMD' ? amountAmd : convertPrice(amountAmd, 'AMD', currency);
}

function formatUsdMoney(amountUsd: number, currency: CurrencyCode): string {
  return formatPriceInCurrency(toDisplayAmount(amountUsd, currency), currency);
}

function resolveDisplayImageUrl(item: OrderItem): string | null {
  if (item.imageUrl?.trim()) {
    return item.imageUrl.trim();
  }
  const optionImage = item.variantOptions?.find((opt) => opt.imageUrl?.trim())?.imageUrl?.trim();
  return optionImage ?? null;
}

function buildVariantSummary(item: OrderItem): string | null {
  const parts = (item.variantOptions ?? [])
    .filter((opt) => opt.value)
    .map((opt) => opt.label || opt.value);
  if (parts.length > 0) {
    return parts.join(' · ');
  }
  if (item.variantTitle && item.variantTitle !== item.productTitle) {
    return item.variantTitle;
  }
  return null;
}

function PurchaseHistoryRow({
  item,
  currency,
}: {
  item: OrderItem;
  currency: CurrencyCode;
}) {
  const { t } = useTranslation();
  const variantSummary = buildVariantSummary(item);
  const unitPrice = formatUsdMoney(item.price, currency);
  const lineTotal = formatUsdMoney(item.total, currency);
  const imageUrl = resolveDisplayImageUrl(item);

  return (
    <li className="flex gap-4">
      <div className={ORDER_SUCCESS_ITEM_IMAGE}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.productTitle}
            className="size-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-sm font-bold text-[#F66812]">
            ×{item.quantity}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="font-semibold text-[#1a1a1a]">{item.productTitle}</p>
        {variantSummary ? (
          <p className="mt-0.5 text-sm text-[#666666]">{variantSummary}</p>
        ) : null}
        <p className="mt-1 text-sm text-[#666666]">
          {t('orders.success.purchaseHistory.quantityLine')
            .replace('{qty}', String(item.quantity))
            .replace('{unitPrice}', unitPrice)
            .replace('{total}', lineTotal)}
        </p>
      </div>
    </li>
  );
}

function PurchaseHistoryTotals({
  totals,
  currency,
  shippingMethod,
}: {
  totals: Order['totals'];
  currency: CurrencyCode;
  shippingMethod: string;
}) {
  const { t } = useTranslation();

  const subtotalLabel = formatUsdMoney(totals.subtotal, currency);
  const discountAmount = totals.discount > 0 ? formatUsdMoney(totals.discount, currency) : null;
  const shippingAmd = totals.shipping;
  const bagFeeAmd = totals.bagFee ?? 0;
  const shippingLabel =
    shippingMethod === 'pickup'
      ? t('checkout.shipping.freePickup')
      : formatPriceInCurrency(
          currency === 'AMD' ? shippingAmd : convertPrice(shippingAmd, 'AMD', currency),
          currency
        );
  const bagFeeLabel =
    bagFeeAmd > 0
      ? formatPriceInCurrency(
          currency === 'AMD' ? bagFeeAmd : convertPrice(bagFeeAmd, 'AMD', currency),
          currency
        )
      : null;

  const grandTotal = (() => {
    const subtotalAmd = convertPrice(totals.subtotal, 'USD', 'AMD');
    const discountAmd = convertPrice(totals.discount, 'USD', 'AMD');
    const totalAmd = subtotalAmd - discountAmd + shippingAmd + bagFeeAmd;
    const value = currency === 'AMD' ? totalAmd : convertPrice(totalAmd, 'AMD', currency);
    return formatPriceInCurrency(value, currency);
  })();

  return (
    <div className="mt-6 border-t border-[#eeeeee] pt-5">
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-[#666666]">
          <span>{t('orders.orderSummary.subtotal')}</span>
          <span className="font-medium text-[#1a1a1a]">{subtotalLabel}</span>
        </div>
        {discountAmount ? (
          <div className="flex justify-between text-[#666666]">
            <span>{t('orders.orderSummary.discount')}</span>
            <span className="font-medium text-[#F66812]">−{discountAmount}</span>
          </div>
        ) : null}
        <div className="flex justify-between text-[#666666]">
          <span>{t('orders.orderSummary.shipping')}</span>
          <span className="font-medium text-[#1a1a1a]">{shippingLabel}</span>
        </div>
        {bagFeeLabel ? (
          <div className="flex justify-between text-[#666666]">
            <span>{t('checkout.summary.bagFee')}</span>
            <span className="font-medium text-[#1a1a1a]">{bagFeeLabel}</span>
          </div>
        ) : null}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-[#eeeeee] pt-4">
        <span className="text-base font-bold text-[#1a1a1a]">
          {t('orders.success.purchaseHistory.totalPaid')}
        </span>
        <span className="text-xl font-bold text-[#F66812]">{grandTotal}</span>
      </div>
    </div>
  );
}

export function OrderPurchaseHistory({
  items,
  currency,
  totals,
  shippingMethod,
}: OrderPurchaseHistoryProps) {
  const { t } = useTranslation();

  return (
    <section className={`mt-8 w-full ${ORDER_SUCCESS_CARD}`}>
      <h2 className="text-center text-lg font-bold text-[#1a1a1a]">
        {t('orders.success.purchaseHistory.title')}
      </h2>
      {items.length === 0 ? (
        <p className="mt-6 text-center text-sm text-[#666666]">
          {t('orders.success.purchaseHistory.empty')}
        </p>
      ) : (
        <ul className="mt-6 space-y-5">
          {items.map((item) => (
            <PurchaseHistoryRow key={item.variantId} item={item} currency={currency} />
          ))}
        </ul>
      )}
      <PurchaseHistoryTotals totals={totals} currency={currency} shippingMethod={shippingMethod} />
    </section>
  );
}
