'use client';

import { useState, useEffect } from 'react';
import type { CurrencyCode } from '../../lib/currency';
import { getStoredCurrency, HYDRATION_SAFE_CURRENCY } from '../../lib/currency';

/**
 * Default must match `getStoredCurrency()` on the server (no `window`) so SSR and
 * the first client render match and avoid hydration mismatches; then sync from storage.
 */
const SSR_CURRENCY_DEFAULT = HYDRATION_SAFE_CURRENCY;

/**
 * Hook for managing currency state
 * @returns Current currency code
 */
export function useCurrency() {
  const [currency, setCurrency] = useState<CurrencyCode>(SSR_CURRENCY_DEFAULT);

  useEffect(() => {
    setCurrency(getStoredCurrency());

    const handleCurrencyUpdate = () => {
      setCurrency(getStoredCurrency());
    };
    
    const handleCurrencyRatesUpdate = () => {
      setCurrency(getStoredCurrency());
    };

    window.addEventListener('currency-updated', handleCurrencyUpdate);
    window.addEventListener('currency-rates-updated', handleCurrencyRatesUpdate);
    
    return () => {
      window.removeEventListener('currency-updated', handleCurrencyUpdate);
      window.removeEventListener('currency-rates-updated', handleCurrencyRatesUpdate);
    };
  }, []);

  return currency;
}




