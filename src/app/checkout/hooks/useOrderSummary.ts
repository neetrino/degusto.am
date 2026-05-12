import { useMemo } from 'react';
import { convertPrice } from '../../../lib/currency';
import type { Cart } from '../types';

interface UseOrderSummaryProps {
  cart: Cart | null;
  shippingMethod: 'pickup' | 'delivery';
  deliveryPrice: number | null;
  bagFee: number;
  currency: 'USD' | 'AMD' | 'EUR' | 'RUB' | 'GEL';
}

export function useOrderSummary({
  cart,
  shippingMethod,
  deliveryPrice,
  bagFee,
  currency,
}: UseOrderSummaryProps) {
  const orderSummary = useMemo(() => {
    if (!cart || cart.items.length === 0) {
      return {
        subtotalAMD: 0,
        taxAMD: 0,
        bagFeeAMD: 0,
        shippingAMD: 0,
        totalAMD: 0,
        subtotalDisplay: 0,
        taxDisplay: 0,
        bagFeeDisplay: 0,
        shippingDisplay: 0,
        totalDisplay: 0,
      };
    }

    const subtotalAMD = convertPrice(cart.totals.subtotal, 'USD', 'AMD');
    const taxAMD = convertPrice(cart.totals.tax, 'USD', 'AMD');
    const shippingAMD = shippingMethod === 'delivery' && deliveryPrice !== null ? deliveryPrice : 0;
    const bagFeeAMD = shippingMethod === 'delivery' ? bagFee : 0;
    const totalAMD = subtotalAMD + taxAMD + shippingAMD + bagFeeAMD;
    
    const subtotalDisplay = currency === 'AMD' ? subtotalAMD : convertPrice(subtotalAMD, 'AMD', currency);
    const taxDisplay = currency === 'AMD' ? taxAMD : convertPrice(taxAMD, 'AMD', currency);
    const shippingDisplay = currency === 'AMD' ? shippingAMD : convertPrice(shippingAMD, 'AMD', currency);
    const bagFeeDisplay = currency === 'AMD' ? bagFeeAMD : convertPrice(bagFeeAMD, 'AMD', currency);
    const totalDisplay = currency === 'AMD' ? totalAMD : convertPrice(totalAMD, 'AMD', currency);
    
    return {
      subtotalAMD,
      taxAMD,
      bagFeeAMD,
      shippingAMD,
      totalAMD,
      subtotalDisplay,
      taxDisplay,
      bagFeeDisplay,
      shippingDisplay,
      totalDisplay,
    };
  }, [cart, shippingMethod, deliveryPrice, bagFee, currency]);

  return { orderSummary };
}




