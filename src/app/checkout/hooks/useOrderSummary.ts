import { useMemo } from 'react';
import { convertPrice } from '../../../lib/currency';
import type { Cart } from '../types';

interface UseOrderSummaryProps {
  cart: Cart | null;
  shippingMethod: 'pickup' | 'delivery';
  deliveryPrice: number | null;
  bagFee: number;
  currency: 'USD' | 'AMD' | 'EUR' | 'RUB' | 'GEL';
  /** Coupon discount amount in USD (same basis as `cart.totals.subtotal`). */
  couponDiscountUsd?: number;
}

export function useOrderSummary({
  cart,
  shippingMethod,
  deliveryPrice,
  bagFee,
  currency,
  couponDiscountUsd = 0,
}: UseOrderSummaryProps) {
  const orderSummary = useMemo(() => {
    if (!cart || cart.items.length === 0) {
      return {
        subtotalAMD: 0,
        bagFeeAMD: 0,
        shippingAMD: 0,
        taxAMD: 0,
        totalAMD: 0,
        subtotalDisplay: 0,
        bagFeeDisplay: 0,
        shippingDisplay: 0,
        discountDisplay: 0,
        totalDisplay: 0,
      };
    }

    const subtotalAMD = convertPrice(cart.totals.subtotal, 'USD', 'AMD');
    const taxAMD = convertPrice(cart.totals.tax, 'USD', 'AMD');
    const shippingAMD = shippingMethod === 'delivery' && deliveryPrice !== null ? deliveryPrice : 0;
    const bagFeeAMD = bagFee;
    const discountAMD = convertPrice(Math.max(0, couponDiscountUsd), 'USD', 'AMD');
    const discountedSubtotalAMD = Math.max(0, subtotalAMD - discountAMD);
    const totalAMD = discountedSubtotalAMD + taxAMD + shippingAMD + bagFeeAMD;

    const subtotalDisplay = currency === 'AMD' ? subtotalAMD : convertPrice(subtotalAMD, 'AMD', currency);
    const shippingDisplay = currency === 'AMD' ? shippingAMD : convertPrice(shippingAMD, 'AMD', currency);
    const bagFeeDisplay = currency === 'AMD' ? bagFeeAMD : convertPrice(bagFeeAMD, 'AMD', currency);
    const discountDisplay = currency === 'AMD' ? discountAMD : convertPrice(discountAMD, 'AMD', currency);
    const totalDisplay = currency === 'AMD' ? totalAMD : convertPrice(totalAMD, 'AMD', currency);

    return {
      subtotalAMD,
      bagFeeAMD,
      shippingAMD,
      taxAMD,
      totalAMD,
      subtotalDisplay,
      bagFeeDisplay,
      shippingDisplay,
      discountDisplay,
      totalDisplay,
    };
  }, [cart, shippingMethod, deliveryPrice, bagFee, currency, couponDiscountUsd]);

  return { orderSummary };
}
